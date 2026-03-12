import { getBatchQuotes } from "@apps/web/lib/qq-finance/quote";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";
// We import business logic from the web app since this is a monorepo
import { notifyUserById } from "./notify";

export interface Env {
  DATABASE_URL: string;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  NEXT_PUBLIC_HOST_URL: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(processStockAlerts(env));
  },
};

async function processStockAlerts(env: Env) {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle({ client: sql, schema });

  try {
    // 1. Get all enabled alerts
    const alerts = await db.query.stockAlert.findMany({
      where: (alerts, { eq }) => eq(alerts.enabled, true),
    });

    if (alerts.length === 0) return;

    // 2. Batch unique stock codes and fetch quotes
    const uniqueCodes = [...new Set(alerts.map((a) => a.stockCode))];
    const allQuotes = await getBatchQuotes(uniqueCodes);

    const quoteMap = new Map(
      allQuotes.map((q) => {
        return [q.code, q];
      }),
    );

    // 3. Evaluate each alert rule
    const now = new Date().toISOString();

    for (const alert of alerts) {
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

          const url = new URL("/dashboard", env.NEXT_PUBLIC_HOST_URL);
          url.searchParams.set("id", alert.id);

          await notifyUserById(
            db,
            alert.userId,
            {
              title: `📈 ${alert.stockName}`,
              body: message,
              url: url.href,
            },
            env.VAPID_PRIVATE_KEY,
            env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          );

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
