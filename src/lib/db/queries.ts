import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import * as schema from "./schema";

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
});

// This is the one to use for static routes (i.e. ISR/SSG)
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
});

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, _receiver) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export async function createStockAlert(data: {
  id: string;
  userId: string;
  stockCode: string;
  stockName: string;
  market: string;
  ruleType: string;
  ruleDirection: string;
  ruleValue: number;
  notifyInterval: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}) {
  return db.insert(schema.stockAlert).values(data);
}

export async function deleteStockAlert(id: string, userId: string) {
  return db
    .delete(schema.stockAlert)
    .where(
      and(eq(schema.stockAlert.id, id), eq(schema.stockAlert.userId, userId)),
    );
}

export async function updateStockAlert(
  id: string,
  userId: string,
  data: Partial<
    Omit<typeof schema.stockAlert.$inferInsert, "id" | "userId" | "createdAt">
  > & { updatedAt: string },
) {
  return db
    .update(schema.stockAlert)
    .set(data)
    .where(
      and(eq(schema.stockAlert.id, id), eq(schema.stockAlert.userId, userId)),
    );
}

export async function getStockAlertsByUserId(userId: string) {
  return db.query.stockAlert.findMany({
    where: eq(schema.stockAlert.userId, userId),
    orderBy: [desc(schema.stockAlert.createdAt)],
  });
}

export async function getAlertHistoryByUserId(userId: string, limit = 50) {
  return db.query.alertHistory.findMany({
    where: eq(schema.alertHistory.userId, userId),
    orderBy: [desc(schema.alertHistory.notifiedAt)],
    limit,
  });
}
