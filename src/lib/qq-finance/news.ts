import { qqFetch } from "./client";
import type { StockNews } from "./types";

/**
 * Get stock news and announcements.
 * @param code - Stock code with market prefix, e.g. "sh600519"
 */
export async function getStockNews(
  code: string,
  page = 0,
  count = 20,
): Promise<StockNews[]> {
  const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/news/info/search?stock=${encodeURIComponent(code)}&page=${page}&n=${count}`;
  const res = await qqFetch(url);
  const data = (await res.json()) as Record<string, unknown>;

  const results: StockNews[] = [];
  const newsData = data.data as Record<string, unknown> | undefined;
  if (!newsData) return results;

  const list = newsData.data as Array<Record<string, string>> | undefined;
  if (!list) return results;

  for (const item of list) {
    results.push({
      id: item.id ?? "",
      title: item.title ?? "",
      url: item.url ?? "",
      source: item.source ?? "",
      time: item.time ?? "",
    });
  }

  return results;
}
