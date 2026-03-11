import { qqFetch } from "./client";
import type { MinuteData } from "./types";

/**
 * Get intraday minute-level data for a stock.
 * @param code - Stock code with market prefix, e.g. "sh600519"
 */
export async function getMinuteData(code: string): Promise<MinuteData[]> {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${encodeURIComponent(code)}`;
  const res = await qqFetch(url);
  const data = (await res.json()) as Record<string, unknown>;

  const results: MinuteData[] = [];
  const stockData = data.data as Record<string, unknown> | undefined;
  if (!stockData) return results;

  const codeKey = Object.keys(stockData)[0];
  if (!codeKey) return results;

  const info = stockData[codeKey] as Record<string, unknown>;
  const minuteData = info?.data as Record<string, unknown> | undefined;
  const lines = minuteData?.data as string[] | undefined;
  if (!lines) return results;

  for (const line of lines) {
    const parts = line.split(" ");
    if (parts.length >= 3) {
      results.push({
        time: parts[0],
        price: parseFloat(parts[1]),
        volume: parseFloat(parts[2]),
        avgPrice:
          parts.length >= 4 ? parseFloat(parts[3]) : parseFloat(parts[1]),
      });
    }
  }

  return results;
}
