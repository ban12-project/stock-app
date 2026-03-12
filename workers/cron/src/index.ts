import { getBatchQuotes } from "@apps/web/lib/qq-finance/quote";
import type { StockQuote } from "@apps/web/lib/qq-finance/types";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import webpush from "web-push";
import * as schema from "./db/schema";
import { notifyUserById } from "./notify";

type StockAlert = typeof schema.stockAlert.$inferSelect;

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

// ─── Pure function: evaluate a single alert rule ───────────────────────────
interface EvalResult {
  triggered: boolean;
  message: string;
}

function evaluateAlertRule(alert: StockAlert, quote: StockQuote): EvalResult {
  const price = quote.currentPrice;
  const change = quote.changeAmount;
  const pct = quote.changePercent;
  const high = quote.high;
  const low = quote.low;
  const changeSign = change >= 0 ? "+" : "";

  const statsSub = `${changeSign}${change.toFixed(2)} (${changeSign}${pct.toFixed(2)}%)`;
  const commonSuffix = `今日最高 ¥${high.toFixed(2)}，最低 ¥${low.toFixed(2)}。`;

  switch (alert.ruleType) {
    case "price_change_pct": {
      const threshold = alert.ruleValue;
      const trend = pct >= 0 ? "上涨" : "下跌";
      if (alert.ruleDirection === "up" && pct >= threshold) {
        return {
          triggered: true,
          message: `该股现报 ¥${price.toFixed(2)}，较昨日${trend} ${Math.abs(pct).toFixed(2)}% (${statsSub})。${commonSuffix}`,
        };
      }
      if (alert.ruleDirection === "down" && pct <= -threshold) {
        return {
          triggered: true,
          message: `该股现报 ¥${price.toFixed(2)}，较昨日${trend} ${Math.abs(pct).toFixed(2)}% (${statsSub})。${commonSuffix}`,
        };
      }
      if (alert.ruleDirection === "both" && Math.abs(pct) >= threshold) {
        return {
          triggered: true,
          message: `该股股价大幅波动，现报 ¥${price.toFixed(2)}，涨跌幅为 ${statsSub}。${commonSuffix}`,
        };
      }
      break;
    }

    case "price_target": {
      const target = alert.ruleValue;
      if (alert.ruleDirection === "up" && price >= target) {
        return {
          triggered: true,
          message: `已触及止盈价 ¥${target}，当前价 ¥${price.toFixed(2)} (${statsSub})。${commonSuffix}`,
        };
      }
      if (alert.ruleDirection === "down" && price <= target) {
        return {
          triggered: true,
          message: `已跌至止损价 ¥${target}，当前价 ¥${price.toFixed(2)} (${statsSub})。${commonSuffix}`,
        };
      }
      if (alert.ruleDirection === "both") {
        if (
          alert.lastPrice &&
          ((alert.lastPrice < target && price >= target) ||
            (alert.lastPrice > target && price <= target))
        ) {
          return {
            triggered: true,
            message: `股价已穿过目标价 ¥${target}，当前价 ¥${price.toFixed(2)} (${statsSub})。${commonSuffix}`,
          };
        }
      }
      break;
    }

    case "volume_spike": {
      if (quote.volume > 0) {
        const avgVolume = alert.lastPrice ? alert.lastPrice : quote.volume;
        const ratio = quote.volume / avgVolume;
        if (ratio >= alert.ruleValue) {
          const formatVolume = (v: number) => {
            if (v >= 100000000) return `${(v / 100000000).toFixed(2)}亿`;
            if (v >= 10000) return `${(v / 10000).toFixed(2)}万`;
            return v.toString();
          };
          return {
            triggered: true,
            message: `该股成交量激增至 ${ratio.toFixed(1)} 倍（共 ${formatVolume(quote.volume)}），现价 ¥${price.toFixed(2)} (${statsSub})。${commonSuffix}`,
          };
        }
      }
      break;
    }
  }

  return { triggered: false, message: "" };
}

// ─── Check cooldown ────────────────────────────────────────────────────────
function isCooldownPassed(
  notifyInterval: number,
  lastNotifiedAt: string | null,
  now: string,
): boolean {
  if (notifyInterval <= 0 || !lastNotifiedAt) return true;
  const elapsed =
    (new Date(now).getTime() - new Date(lastNotifiedAt).getTime()) /
    (1000 * 60);
  return elapsed >= notifyInterval;
}

// ─── Main pipeline ─────────────────────────────────────────────────────────
async function processStockAlerts(env: Env) {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle({ client: sql, schema });

  // Initialize VAPID once for all notifications
  webpush.setVapidDetails(
    "mailto:coda@ban12.com",
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  try {
    // 1. Get all enabled alerts
    const alerts = await db.query.stockAlert.findMany({
      where: (alerts, { eq }) => eq(alerts.enabled, true),
    });

    if (alerts.length === 0) return;

    // 2. Batch unique stock codes and fetch quotes
    const uniqueCodes = [...new Set(alerts.map((a) => a.stockCode))];
    const allQuotes = await getBatchQuotes(uniqueCodes);

    const quoteMap = new Map(allQuotes.map((q) => [q.code, q]));

    // 3. Evaluate each alert in parallel with error isolation
    const now = new Date().toISOString();

    type PendingNotification = {
      userId: string;
      title: string;
      body: string;
      url: string;
    };

    type PendingHistory = typeof schema.alertHistory.$inferInsert;

    const pendingHistories: PendingHistory[] = [];
    const pendingNotifications: PendingNotification[] = [];
    const alertUpdates: { id: string; data: Record<string, unknown> }[] = [];

    const results = await Promise.allSettled(
      alerts.map(async (alert) => {
        const codeOnly = alert.stockCode.replace(/^(sh|sz|bj)/, "");
        const quote = quoteMap.get(codeOnly) ?? quoteMap.get(alert.stockCode);

        if (!quote || quote.currentPrice === 0) return;

        const { triggered, message } = evaluateAlertRule(alert, quote);

        // Build update — always update lastPrice & lastCheckedAt
        const updateData: Record<string, unknown> = {
          lastPrice: quote.currentPrice,
          lastCheckedAt: now,
          updatedAt: now,
        };

        if (triggered) {
          const shouldNotify = isCooldownPassed(
            alert.notifyInterval,
            alert.lastNotifiedAt,
            now,
          );

          if (shouldNotify) {
            // Merge lastNotifiedAt into the same update
            updateData.lastNotifiedAt = now;

            pendingHistories.push({
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

            pendingNotifications.push({
              userId: alert.userId,
              title: `${alert.stockName} ${alert.stockCode}`,
              body: message,
              url: url.href,
            });
          }
        }

        alertUpdates.push({ id: alert.id, data: updateData });
      }),
    );

    // Log any individual alert processing failures
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Alert processing error:", result.reason);
      }
    }

    // 4. Batch DB writes: update all alerts in parallel
    if (alertUpdates.length > 0) {
      await Promise.allSettled(
        alertUpdates.map(({ id, data }) =>
          db
            .update(schema.stockAlert)
            .set(data)
            .where(eq(schema.stockAlert.id, id)),
        ),
      );
    }

    // 5. Batch insert all alert histories at once
    if (pendingHistories.length > 0) {
      await db.insert(schema.alertHistory).values(pendingHistories);
    }

    // 6. Send notifications grouped by userId to avoid duplicate subscription queries
    if (pendingNotifications.length > 0) {
      const byUser = new Map<string, PendingNotification[]>();
      for (const n of pendingNotifications) {
        const list = byUser.get(n.userId);
        if (list) list.push(n);
        else byUser.set(n.userId, [n]);
      }

      await Promise.allSettled(
        Array.from(byUser.entries()).map(async ([userId, notifications]) => {
          for (const n of notifications) {
            try {
              await notifyUserById(db, userId, {
                title: n.title,
                body: n.body,
                url: n.url,
              });
            } catch (error) {
              console.error(`Notify error [user=${userId}]:`, error);
            }
          }
        }),
      );
    }
  } catch (error) {
    console.error("Cron job error:", error);
  }
}
