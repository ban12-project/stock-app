import { qqFetch } from "./client";
import type { StockQuote } from "./types";

/**
 * Parse QQ Finance quote response format.
 * Response format: v_sh600519="1~贵州茅台~600519~1799.00~1785.00~1790.00~..."
 */
function parseQuoteString(raw: string): StockQuote | null {
  const match = raw.match(/v_\w+="(.+)"/);
  if (!match?.[1]) return null;

  const parts = match[1].split("~");
  if (parts.length < 46) return null;

  return {
    code: parts[2],
    name: parts[1],
    currentPrice: parseFloat(parts[3]),
    previousClose: parseFloat(parts[4]),
    open: parseFloat(parts[5]),
    volume: parseFloat(parts[6]),
    turnover: parseFloat(parts[37]),
    high: parseFloat(parts[33]),
    low: parseFloat(parts[34]),
    changeAmount: parseFloat(parts[31]),
    changePercent: parseFloat(parts[32]),
    date: parts[30]?.substring(0, 8) ?? "",
    time: parts[30]?.substring(8) ?? "",
  };
}

/**
 * Get real-time quote for one or more stocks.
 * @param codes - Stock codes like "sh600519", "sz000001"
 */
export async function getQuote(
  codes: string | string[],
): Promise<StockQuote[]> {
  const codeList = Array.isArray(codes) ? codes : [codes];
  const q = codeList.join(",");
  const url = `https://qt.gtimg.cn/q=${encodeURIComponent(q)}`;
  const res = await qqFetch(url);
  const text = await res.text();

  const lines = text.split("\n").filter((line) => line.includes('="'));
  const quotes: StockQuote[] = [];

  for (const line of lines) {
    const quote = parseQuoteString(line);
    if (quote) quotes.push(quote);
  }

  return quotes;
}

/**
 * Get a single stock quote.
 */
export async function getSingleQuote(code: string): Promise<StockQuote | null> {
  const quotes = await getQuote(code);
  return quotes[0] ?? null;
}

/**
 * Get real-time quotes using the new batch query interface.
 * Supports passing a large number of stock codes.
 */
export async function getBatchQuotes(codes: string[]): Promise<StockQuote[]> {
  if (codes.length === 0) return [];
  const q = codes.join(",");
  const url = `https://web.sqt.gtimg.cn/utf8/q=${q}`;
  const res = await fetch(url, {
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      Connection: "keep-alive",
      Referer: "https://gu.qq.com/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    },
  });

  const text = await res.text();
  const lines = text.split("\n").filter((line) => line.includes('="'));
  const quotes: StockQuote[] = [];

  for (const line of lines) {
    const quote = parseQuoteString(line);
    if (quote) quotes.push(quote);
  }

  return quotes;
}
