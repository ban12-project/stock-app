import { TrendingUp } from "lucide-react";
import { SignInForm } from "@/components/sign-in-form";
import { getDictionary } from "@/get-dictionary";
import type { Locale } from "@/i18n-config";

const backgroundGradient = (
  <div className="absolute inset-0 -z-10">
    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse dark:opacity-10" />
    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000 dark:opacity-10" />
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000 dark:opacity-10" />
  </div>
);

export default async function SignInPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const lang = params.lang as Locale;
  const dictionary = await getDictionary(lang);
  const { nav } = dictionary;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Animated gradient background */}
      {backgroundGradient}

      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{nav.brand}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to monitor your stocks
          </p>
        </div>

        <SignInForm dictionary={dictionary} lang={lang} />

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
