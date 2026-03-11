"use client";

import { Bell, BellOff, Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Messages } from "@/get-dictionary";

import {
  sendTestNotification,
  subscribeUser,
  unsubscribeUser,
} from "@/lib/actions/web-push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushManagerProps {
  dictionary: Messages;
}

export function PushManager({ dictionary }: PushManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const { push } = dictionary;

  useEffect(() => {
    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      } catch (err) {
        console.error("SW registration failed:", err);
      }
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      void registerServiceWorker();
    }
  }, []);

  function subscribeToPush() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        });
        setSubscription(sub);

        // Save to server via server action
        const serializedSub = JSON.parse(JSON.stringify(sub)) as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };
        await subscribeUser(serializedSub);

        toast.success(push.enabledDesc);
      } catch (err) {
        console.error("Failed to subscribe:", err);
        toast.error(push.errorGeneric);
      }
    });
  }

  function unsubscribeFromPush() {
    startTransition(async () => {
      try {
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          setSubscription(null);
          await unsubscribeUser(endpoint);
        }
        toast.success(dictionary.common.success);
      } catch {
        toast.error(push.errorGeneric);
      }
    });
  }

  async function handleTestNotification() {
    try {
      await sendTestNotification({
        message: push.testSent,
        title: dictionary.nav.brand,
      });
      toast.success(push.testSent);
    } catch {
      toast.error(dictionary.common.failed);
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm mb-4">{push.notSupportedDesc}</p>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">{push.iosTip}</p>
            <a
              href="https://support.apple.com/guide/iphone/iph42ab2f3a7/ios#iph4f9a47bbc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              {push.iosTipLink}
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {push.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscription ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                {push.enabledDesc}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribeFromPush}
                disabled={isPending}
                className="cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  dictionary.common.cancel
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestNotification}
              className="w-full text-xs cursor-pointer"
            >
              {push.testBtn}
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{push.disabledDesc}</p>
            <Button
              size="sm"
              onClick={subscribeToPush}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              {push.enableBtn}
            </Button>
          </div>
        )}
      </CardContent>
      <div className="px-6 pb-6 pt-0">
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">{push.iosTip}</p>
          <a
            href="https://support.apple.com/guide/iphone/iph42ab2f3a7/ios#iph4f9a47bbc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {push.iosTipLink}
          </a>
        </div>
      </div>
    </Card>
  );
}
