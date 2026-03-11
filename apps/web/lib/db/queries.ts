import { neon } from "@neondatabase/serverless";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });

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
