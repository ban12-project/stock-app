import { describe, expect, test } from "vitest";
import { getBatchQuotes } from "./quote";

describe("getBatchQuotes", () => {
  test("fetches real-time stock quotes accurately with the new QQ Finance batch API", async () => {
    // Array of codes from user prompt
    const codes = [
      "sz002922",
      "sz000001",
      "sh601766",
      "sz002506",
      "sh601857",
      "sz000725",
      "sz002444",
      "sh600050",
      "sh601908",
      "sz000625",
      "sh600005",
      "sh601390",
      "sh600000",
    ];

    const quotes = await getBatchQuotes(codes);

    // We expect to get some valid stock quote objects matching the codes length (minus any potentially invalid/delisted ones, though these are major stocks)
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.length).toBeLessThanOrEqual(codes.length);

    // Check structure of first quote
    const firstQuote = quotes[0];
    validateQuoteObject(firstQuote);

    // Ensure all quotes have a name and code
    quotes.forEach((quote) => {
      expect(quote.name).toBeDefined();
      expect(quote.code).toBeDefined();
      validateQuoteObject(quote);
    });

    // Additional testing logic: Let's check if sz000001 (Ping An Bank) is returned correctly
    const pingan = quotes.find((q) => q.code === "000001");
    if (pingan) {
      expect(pingan.name).toContain("平安");
    }
  });

  test("handles empty arrays gracefully", async () => {
    const quotes = await getBatchQuotes([]);
    expect(quotes.length).toBe(0);
  });
});

function validateQuoteObject(quote: any) {
  expect(quote).toHaveProperty("code");
  expect(quote).toHaveProperty("name");
  expect(quote).toHaveProperty("currentPrice");
  expect(quote).toHaveProperty("previousClose");
  expect(quote).toHaveProperty("open");
  expect(quote).toHaveProperty("volume");
  expect(quote).toHaveProperty("high");
  expect(quote).toHaveProperty("low");
  expect(quote).toHaveProperty("changeAmount");
  expect(quote).toHaveProperty("changePercent");
}
