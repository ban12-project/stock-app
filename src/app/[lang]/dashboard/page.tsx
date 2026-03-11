export const dynamic = "force-dynamic";

import { DashboardContent } from "@/components/dashboard-content";
import { getDictionary } from "@/get-dictionary";
import type { Locale } from "@/i18n-config";
import { getAlertHistory, getStockAlerts } from "@/lib/actions/dashboard";

export default async function DashboardPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const lang = params.lang as Locale;

  // Execute data fetching in parallel on the server
  const [alerts, history, dictionary] = await Promise.all([
    getStockAlerts(),
    getAlertHistory(),
    getDictionary(lang),
  ]);

  return (
    <DashboardContent
      alerts={alerts}
      history={history}
      dictionary={dictionary}
    />
  );
}
