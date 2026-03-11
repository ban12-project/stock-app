import { qqFetch } from "./client";
import type { SearchResult } from "./types";

export interface QQFinanceSearchResponse {
  stock: StockItem[];
  sector: unknown[];
  news: NewsInfo;
  fund: unknown[];
  function: unknown[];
  manager: unknown[];
  relatedFund: RelatedFundGroup[];
  edu: EduInfo;
  xuangu: XuanguInfo;
  user: unknown[];
  ipoFlag: boolean;
  abtInfo: AbtInfo;
  ifStockPtMixFlag: boolean;
  correct: string[];
  correct_query: string[];
  tabList: string[];
  ai: AiInfo;
  indexShowNum: number;
  helpResponse: null | unknown;
  aiGuess: AiGuessInfo;
  stockRelatedFund: StockRelatedFund;
  rankInfo: RankInfo;
  intentionInfo: IntentionInfo;
}

export interface StockItem {
  code: string;
  name: string;
  type: string;
  suggest: string;
  reportInfo: ReportInfo;
  status: string;
  labelList: unknown[];
}

export interface ReportInfo {
  match_field: string;
  match_level: string;
  rerank_by_zixuan: string;
}

export interface NewsInfo {
  has_next: number;
  next_offset: number;
  req_session: string;
  news_list: unknown[];
  mix_type: number;
}

export interface RelatedFundGroup {
  symbol: string[];
  fund: FundDetail[];
}

export interface FundDetail {
  jjdm: string;
  rzhbl: string;
  smartbox_type: string;
  jjjc: string;
  rzrq: string;
  jjgm: string;
  kjy: boolean;
  rzsj: string;
  lrrq: string;
  cgbl: string;
  status: string;
  cgbl_value: string;
}

export interface EduInfo {
  hitSearch: unknown[];
  list: unknown[];
  snapshotId: string;
  snapshotTime: string;
  total: string;
}

export interface XuanguInfo {
  has_next: number;
  data: unknown[];
}

export interface AbtInfo {
  retcode: string;
  retmsg: string;
  cache_expire_time: string;
  data: unknown[];
  module_even_key: Record<string, unknown>;
}

export interface AiInfo {
  hit: boolean;
  pos: string;
  query: string;
  expand: null | unknown;
  from: string;
}

export interface AiGuessInfo {
  aiGuessList: unknown[];
  source: string;
  param: null | unknown;
}

export interface StockRelatedFund {
  stock: StockItem;
  etf: unknown[];
  jj: AssociatedFund[];
}

export interface AssociatedFund {
  code: string;
  name: string;
  price: string;
  priceRatio: string;
  turnover: string;
  status: string;
  holdPercent: string;
  stockType: string;
  labelList: unknown[];
}

export interface RankInfo {
  name: string;
  route: string;
  rankList: unknown[];
}

export interface IntentionInfo {
  intention: string;
}

/**
 * Search stocks by keyword.
 * Uses QQ Finance smartbox search API.
 */
export async function searchStocks(query: string): Promise<SearchResult[]> {
  const url = new URL(
    "https://proxy.finance.qq.com/cgi/cgi-bin/smartbox/search",
  );
  url.searchParams.set("stockFlag", "1");
  url.searchParams.set("fundFlag", "1");
  url.searchParams.set("app", "official_website");
  url.searchParams.set("query", query);
  const res = await qqFetch(url.href);
  const data = await res.json<QQFinanceSearchResponse>();

  const results: SearchResult[] = [];

  // 1. Process main stock results
  if (data.stock && Array.isArray(data.stock)) {
    for (const item of data.stock) {
      // code format is "sz002922", extract market (sz)
      const market = item.code.slice(0, 2);
      const symbol = item.code.slice(2);

      results.push({
        code: symbol,
        name: item.name,
        market: market,
        type: "stock",
      });
    }
  }

  // 2. Process fund results if they exist in the main fund array
  if (data.fund && Array.isArray(data.fund)) {
    for (const item of data.fund) {
      // Use record cast if we need to access optional fields safely
      const fund = item as Record<string, unknown>;
      const code = (fund.code || fund.jjdm) as string | undefined;
      const name = (fund.name || fund.jjjc) as string | undefined;

      if (code && name) {
        results.push({
          code,
          name,
          market: "fund",
          type: "fund",
        });
      }
    }
  }

  return results;
}
