// QQ Finance API common request headers and utilities

const QQ_FINANCE_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  Referer: "https://stockapp.finance.qq.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export async function qqFetch(url: string): Promise<Response> {
  return fetch(url, {
    method: "GET",
    headers: QQ_FINANCE_HEADERS,
  });
}
