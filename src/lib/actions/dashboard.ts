"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import * as queries from "@/lib/db/queries";
import { searchStocks } from "@/lib/qq-finance";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

const addStockAlertSchema = z.object({
  stockCode: z.string().min(1),
  stockName: z.string().min(1),
  market: z.string().min(1),
  ruleType: z.string(),
  ruleDirection: z.string(),
  ruleValue: z.number().positive(),
  notifyInterval: z.number().min(0),
});

export async function addStockAlert(
  unsafeData: z.infer<typeof addStockAlertSchema>,
) {
  const user = await requireUser();
  const data = addStockAlertSchema.parse(unsafeData);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await queries.createStockAlert({
    id,
    userId: user.id,
    stockCode: data.stockCode,
    stockName: data.stockName,
    market: data.market,
    ruleType: data.ruleType,
    ruleDirection: data.ruleDirection,
    ruleValue: data.ruleValue,
    notifyInterval: data.notifyInterval,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  return { id };
}

export async function removeStockAlert(id: string) {
  const user = await requireUser();
  await queries.deleteStockAlert(id, user.id);
  revalidatePath("/dashboard");
  return { success: true };
}

const updateStockAlertSchema = z.object({
  ruleType: z.string().optional(),
  ruleDirection: z.string().optional(),
  ruleValue: z.number().positive().optional(),
  notifyInterval: z.number().min(0).optional(),
  enabled: z.boolean().optional(),
});

export async function updateStockAlert(
  id: string,
  unsafeData: z.infer<typeof updateStockAlertSchema>,
) {
  const user = await requireUser();
  const data = updateStockAlertSchema.parse(unsafeData);

  await queries.updateStockAlert(id, user.id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getStockAlerts() {
  const user = await requireUser();
  return queries.getStockAlertsByUserId(user.id);
}

export async function getAlertHistory() {
  const user = await requireUser();
  return queries.getAlertHistoryByUserId(user.id);
}

export async function searchStocksAction(query: string) {
  if (!query) return { results: [] };

  try {
    const results = await searchStocks(query);
    return { results };
  } catch (error) {
    console.error("Stock search errorAction:", error);
    return { results: [] };
  }
}
