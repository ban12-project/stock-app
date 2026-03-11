"use client";

import { Fingerprint, Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Messages } from "@/get-dictionary";
import { authClient } from "@/lib/auth-client";

interface SignInFormProps {
  dictionary: Messages;
  lang: string;
}

export function SignInForm({ dictionary, lang }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { nav } = dictionary;

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    startTransition(async () => {
      try {
        await authClient.signIn.magicLink({
          email,
          callbackURL: `/${lang}/dashboard`,
        });
        setMagicLinkSent(true);
        toast.success("Magic link sent! Check your email.");
      } catch {
        toast.error("Failed to send magic link. Please try again.");
      }
    });
  }

  function handlePasskey() {
    startTransition(async () => {
      try {
        await authClient.signIn.passkey();
        window.location.href = `/${lang}/dashboard`;
      } catch {
        toast.error("Passkey authentication failed.");
      }
    });
  }

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">{nav.signIn}</CardTitle>
        <CardDescription>Choose your preferred sign-in method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Passkey Button */}
        <Button
          variant="outline"
          className="w-full h-12 text-base gap-2 cursor-pointer"
          onClick={handlePasskey}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Fingerprint className="w-5 h-5" />
          )}
          Sign in with Passkey
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Magic Link Form */}
        {magicLinkSent ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-lg">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMagicLinkSent(false)}
              className="cursor-pointer"
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base gap-2 cursor-pointer"
              disabled={isPending || !email}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
              Send Magic Link
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
