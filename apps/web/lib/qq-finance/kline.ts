import { qqFetch } from "./client";
import type { KlineData } from "./types";

export type KlineType = "day" | "week" | "month";

/**
 * Get historical K-line data for a stock.
 * @param code - Stock code with market prefix, e.g. "sh600519"
 * @param type - K-line type: "day", "week", "month"
 */
export async function getKline(
  code: string,
  type: KlineType = "day",
): Promise<KlineData[]> {
  const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?p=1&param=${encodeURIComponent(code)},${type},,,320,qfq`;
  const res = await qqFetch(url);
  const data = (await res.json()) as Record<string, unknown>;

  const results: KlineData[] = [];
  const stockData = data.data as Record<string, unknown> | undefined;
  if (!stockData) return results;

  const codeKey = Object.keys(stockData)[0];
  if (!codeKey) return results;

  const info = stockData[codeKey] as Record<string, unknown>;
  const klineKey = type === "day" ? "day" : type === "week" ? "week" : "month";
  const klines = (info?.[klineKey] ??
    info?.qfqday ??
    info?.qfqweek ??
    info?.qfqmonth) as string[][] | undefined;
  if (!klines) return results;

  for (const k of klines) {
    if (k.length >= 6) {
      results.push({
        date: k[0],
        open: parseFloat(k[1]),
        close: parseFloat(k[2]),
        high: parseFloat(k[3]),
        low: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      });
    }
  }

  return results;
}
