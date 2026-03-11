import { BarChart3, Bell, Clock, Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/get-dictionary";
import type { Locale } from "@/i18n-config";

export default async function HomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: paramLang } = await props.params;
  const lang = paramLang as Locale;
  const dictionary = await getDictionary(lang);
  const { home, nav } = dictionary;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">{nav.brand}</span>
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link href={`/${lang}/sign-in`}>
              <Button variant="outline" className="cursor-pointer">
                {nav.signIn}
              </Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm mb-8">
              <Zap className="w-4 h-4 text-primary" />
              {home.badgeTitle}
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent pb-2">
              {home.heroTitle1}
              <br />
              {home.heroTitle2}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {home.heroSubtitle}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href={`/${lang}/sign-in`}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base gap-2 cursor-pointer"
                >
                  <TrendingUp className="w-5 h-5" />
                  {home.getStarted}
                </Button>
              </Link>
              <Link href={`/${lang}/sign-in`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base cursor-pointer"
                >
                  {home.learnMore}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">
            {home.featuresTitle}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {home.featuresSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Bell,
              title: home.feature1Title,
              description: home.feature1Desc,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: Shield,
              title: home.feature2Title,
              description: home.feature2Desc,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              icon: Zap,
              title: home.feature3Title,
              description: home.feature3Desc,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10",
            },
            {
              icon: BarChart3,
              title: home.feature4Title,
              description: home.feature4Desc,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
            {
              icon: Clock,
              title: home.feature5Title,
              description: home.feature5Desc,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              icon: TrendingUp,
              title: home.feature6Title,
              description: home.feature6Desc,
              color: "text-pink-500",
              bg: "bg-pink-500/10",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`inline-flex p-3 rounded-lg ${feature.bg} mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              {home.ctaTitle}
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              {home.ctaDesc}
            </p>
            <Link href={`/${lang}/sign-in`}>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base cursor-pointer"
              >
                {home.ctaButton}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>{nav.brand}</span>
          </div>
          <p>{home.footerText}</p>
        </div>
      </footer>
    </div>
  );
}
