"use client";

import { Fingerprint, Loader2, LogOut, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Messages } from "@/get-dictionary";
import { authClient, signOut, useSession } from "@/lib/auth-client";

interface UserNavProps {
  dictionary: Messages;
}

export function UserNav({ dictionary }: UserNavProps) {
  const { data: session } = useSession();
  const params = useParams();
  const lang = params.lang as string;
  const [isPending, startTransition] = useTransition();

  function handleAddPasskey() {
    startTransition(async () => {
      try {
        await authClient.passkey.addPasskey();
        toast.success("Passkey registered successfully!");
      } catch {
        toast.error("Failed to register passkey. Please try again.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium">{session?.user?.name ?? "User"}</p>
          <p className="text-xs text-muted-foreground">
            {session?.user?.email ?? ""}
          </p>
        </div>
        <DropdownMenuItem
          onClick={handleAddPasskey}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Fingerprint className="w-4 h-4 mr-2" />
          )}
          Manage Passkey
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = `/${lang}`;
                },
              },
            })
          }
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {dictionary.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
