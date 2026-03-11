export interface StockQuote {
  code: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  changeAmount: number;
  changePercent: number;
  date: string;
  time: string;
}

export interface SearchResult {
  code: string;
  name: string;
  market: string;
  type: string;
}

export interface KlineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface MinuteData {
  time: string;
  price: number;
  volume: number;
  avgPrice: number;
}

export interface StockNews {
  id: string;
  title: string;
  url: string;
  source: string;
  time: string;
}
