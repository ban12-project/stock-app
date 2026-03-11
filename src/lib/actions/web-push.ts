"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import webpush from "web-push";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/queries";
import * as schema from "@/lib/db/schema";

type PushSub = typeof schema.pushSubscription.$inferSelect;

async function getEnvAndDb() {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb();
  return { env, db };
}

async function requireUser() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  throw new Error("VAPID keys are not set");
}

webpush.setVapidDetails(
  "mailto:admin@stockmonitor.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Subscribe a user to web push notifications.
 * Called from the client after obtaining a PushSubscription via the Push API.
 */
export async function subscribeUser(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const user = await requireUser();
  const { db } = await getEnvAndDb();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Upsert: remove existing subscription for this endpoint, then insert
  await db
    .delete(schema.pushSubscription)
    .where(eq(schema.pushSubscription.endpoint, sub.endpoint));

  await db.insert(schema.pushSubscription).values({
    id,
    userId: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true };
}

/**
 * Unsubscribe a user from web push notifications.
 * Called from the client after PushSubscription.unsubscribe().
 */
export async function unsubscribeUser(endpoint: string) {
  const user = await requireUser();
  const { db } = await getEnvAndDb();

  await db
    .delete(schema.pushSubscription)
    .where(
      and(
        eq(schema.pushSubscription.endpoint, endpoint),
        eq(schema.pushSubscription.userId, user.id),
      ),
    );

  return { success: true };
}

/**
 * Send a test push notification to the currently authenticated user.
 */
export async function sendTestNotification({
  message,
  title = "Stock Monitor",
}: {
  message: string;
  title?: string;
}) {
  const user = await requireUser();
  const { db } = await getEnvAndDb();

  const subscriptions = await db.query.pushSubscription.findMany({
    where: eq(schema.pushSubscription.userId, user.id),
  });

  if (subscriptions.length === 0) {
    return { success: false, error: "No subscription available" };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: title,
          body: message,
          icon: "/icon-192x192.png",
          url: "/dashboard",
        }),
      ),
    ),
  );

  // Clean up expired subscriptions (410 Gone)
  const expiredEndpoints: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (
      result.status === "rejected" &&
      result.reason instanceof webpush.WebPushError &&
      result.reason.statusCode === 410
    ) {
      expiredEndpoints.push(subscriptions[i].endpoint);
    }
  }
  if (expiredEndpoints.length > 0) {
    for (const endpoint of expiredEndpoints) {
      await db
        .delete(schema.pushSubscription)
        .where(eq(schema.pushSubscription.endpoint, endpoint));
    }
  }

  return { success: true };
}

/**
 * Send push notification to a specific user (used by the cron worker).
 * This is NOT a server action — it's a regular export for use in worker.ts.
 */
export async function notifyUserById(
  db: ReturnType<typeof getDb>,
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
  },
) {
  const subscriptions = await db.query.pushSubscription.findMany({
    where: eq(schema.pushSubscription.userId, userId),
  });

  const expiredEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub: PushSub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        if (
          error instanceof webpush.WebPushError &&
          [404, 410].includes(error.statusCode)
        ) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    for (const endpoint of expiredEndpoints) {
      await db
        .delete(schema.pushSubscription)
        .where(eq(schema.pushSubscription.endpoint, endpoint));
    }
  }
}
