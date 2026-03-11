/**
 * Custom worker entry point for OpenNext on Cloudflare.
 * Wraps the OpenNext-generated handler and adds a scheduled handler for cron jobs.
 *
 * Cron schedule targets China A-share trading hours:
 * - Morning session: 9:30 - 11:30 CST (01:30 - 03:30 UTC)
 * - Afternoon session: 13:00 - 15:00 CST (05:00 - 07:00 UTC)
 */

import { eq } from "drizzle-orm";

import { drizzle } from "drizzle-orm/d1";
// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { notifyUserById } from "./src/lib/actions/web-push";
import * as schema from "./src/lib/db/schema";
import { getBatchQuotes } from "./src/lib/qq-finance/quote";

interface Env {
  DB: D1Database;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  RESEND_API_KEY: string;
  ASSETS: Fetcher;
  IMAGES: unknown;
  WORKER_SELF_REFERENCE: Fetcher;
}

export default {
  fetch: handler.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(processStockAlerts(env));
  },
};

// The re-export is only required if your app uses the DO Queue and DO Tag Cache
// See https://opennext.js.org/cloudflare/caching for details
// @ts-ignore `.open-next/worker.ts` is generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

async function processStockAlerts(env: Env) {
  const db = drizzle(env.DB, { schema });

  try {
    // 1. Get all enabled alerts
    const alerts = await db.query.stockAlert.findMany({
      where: (alerts, { eq }) => eq(alerts.enabled, true),
    });

    if (alerts.length === 0) return;

    // 2. Batch unique stock codes and fetch quotes
    const uniqueCodes = [...new Set(alerts.map((a) => a.stockCode))];

    // Fetch all quotes using the batch query API
    const allQuotes = await getBatchQuotes(uniqueCodes);

    // Build a lookup map
    const quoteMap = new Map(
      allQuotes.map((q) => {
        // The quote code might not include market prefix
        // Try to match by code suffix
        return [q.code, q];
      }),
    );

    // 3. Evaluate each alert rule
    const now = new Date().toISOString();

    for (const alert of alerts) {
      // Extract code without market prefix for lookup
      const codeOnly = alert.stockCode.replace(/^(sh|sz|bj)/, "");
      const quote = quoteMap.get(codeOnly) ?? quoteMap.get(alert.stockCode);

      if (!quote || quote.currentPrice === 0) continue;

      let triggered = false;
      let message = "";

      switch (alert.ruleType) {
        case "price_change_pct": {
          const pct = quote.changePercent;
          const threshold = alert.ruleValue;
          if (alert.ruleDirection === "up" && pct >= threshold) {
            triggered = true;
            message = `${alert.stockName} rose ${pct.toFixed(2)}% (threshold: ${threshold}%)`;
          } else if (alert.ruleDirection === "down" && pct <= -threshold) {
            triggered = true;
            message = `${alert.stockName} fell ${pct.toFixed(2)}% (threshold: -${threshold}%)`;
          } else if (
            alert.ruleDirection === "both" &&
            Math.abs(pct) >= threshold
          ) {
            triggered = true;
            message = `${alert.stockName} changed ${pct.toFixed(2)}% (threshold: ±${threshold}%)`;
          }
          break;
        }

        case "price_target": {
          const price = quote.currentPrice;
          const target = alert.ruleValue;
          if (alert.ruleDirection === "up" && price >= target) {
            triggered = true;
            message = `${alert.stockName} reached ¥${price.toFixed(2)} (target: ¥${target})`;
          } else if (alert.ruleDirection === "down" && price <= target) {
            triggered = true;
            message = `${alert.stockName} dropped to ¥${price.toFixed(2)} (target: ¥${target})`;
          } else if (alert.ruleDirection === "both") {
            if (
              alert.lastPrice &&
              ((alert.lastPrice < target && price >= target) ||
                (alert.lastPrice > target && price <= target))
            ) {
              triggered = true;
              message = `${alert.stockName} crossed ¥${target} (now: ¥${price.toFixed(2)})`;
            }
          }
          break;
        }

        case "volume_spike": {
          // volume_spike: ruleValue is the multiplier (e.g. 2 means 2x average)
          // For simplicity, compare with previous day volume
          // In practice, you'd store and compare against moving average
          if (quote.volume > 0) {
            const avgVolume = alert.lastPrice ? alert.lastPrice : quote.volume;
            const ratio = quote.volume / avgVolume;
            if (ratio >= alert.ruleValue) {
              triggered = true;
              message = `${alert.stockName} volume spike: ${ratio.toFixed(1)}× (threshold: ${alert.ruleValue}×)`;
            }
          }
          break;
        }
      }

      // Update last price and check time
      await db
        .update(schema.stockAlert)
        .set({
          lastPrice: quote.currentPrice,
          lastCheckedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.stockAlert.id, alert.id));

      // 4. Send notification if triggered and cooldown passed
      if (triggered) {
        let shouldNotify = true;
        if (alert.notifyInterval > 0 && alert.lastNotifiedAt) {
          const lastNotified = new Date(alert.lastNotifiedAt).getTime();
          const current = new Date(now).getTime();
          const pasedMinutes = (current - lastNotified) / (1000 * 60);
          if (pasedMinutes < alert.notifyInterval) {
            shouldNotify = false;
          }
        }

        if (shouldNotify) {
          // Log to alert history
          await db.insert(schema.alertHistory).values({
            id: crypto.randomUUID(),
            userId: alert.userId,
            stockAlertId: alert.id,
            stockCode: alert.stockCode,
            stockName: alert.stockName,
            ruleType: alert.ruleType,
            triggerValue: alert.ruleValue,
            currentPrice: quote.currentPrice,
            message,
            notifiedAt: now,
          });

          // Send push notification
          await notifyUserById(db, alert.userId, {
            title: `📈 ${alert.stockName}`,
            body: message,
            url: "/dashboard",
          });

          // Update lastNotifiedAt
          await db
            .update(schema.stockAlert)
            .set({ lastNotifiedAt: now })
            .where(eq(schema.stockAlert.id, alert.id));
        }
      }
    }
  } catch (error) {
    console.error("Cron job error:", error);
  }
}
