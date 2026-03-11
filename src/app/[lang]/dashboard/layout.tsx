import { Bell, TrendingUp } from "lucide-react";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { UserNav } from "@/components/user-nav";
import { getDictionary } from "@/get-dictionary";
import type { Locale } from "@/i18n-config";

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const lang = params.lang as Locale;
  const dictionary = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">
                {dictionary.nav.brand}
              </span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-3">
              <LocaleSwitcher />

              <Button
                variant="ghost"
                size="icon"
                className="relative cursor-pointer"
                asChild
              >
                <Link href="/dashboard/notifications">
                  <Bell className="w-4 h-4" />
                </Link>
              </Button>

              <UserNav dictionary={dictionary} />
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {props.children}
      </main>

      <Toaster />
    </div>
  );
}
