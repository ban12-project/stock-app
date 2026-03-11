import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stockAlert = sqliteTable("stock_alert", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  stockCode: text("stockCode").notNull(),
  stockName: text("stockName").notNull(),
  market: text("market").notNull(),
  ruleType: text("ruleType").notNull(),
  ruleDirection: text("ruleDirection").notNull(),
  ruleValue: real("ruleValue").notNull(),
  notifyInterval: integer("notifyInterval").default(0).notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
  lastPrice: real("lastPrice"),
  lastCheckedAt: text("lastCheckedAt"),
  lastNotifiedAt: text("lastNotifiedAt"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const alertHistory = sqliteTable("alert_history", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  stockAlertId: text("stockAlertId").notNull(),
  stockCode: text("stockCode").notNull(),
  stockName: text("stockName").notNull(),
  ruleType: text("ruleType").notNull(),
  triggerValue: real("triggerValue").notNull(),
  currentPrice: real("currentPrice").notNull(),
  message: text("message").notNull(),
  notifiedAt: text("notifiedAt").notNull(),
});

export const pushSubscription = sqliteTable("push_subscription", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});
