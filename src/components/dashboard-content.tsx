import { Activity, BarChart3, Clock, TrendingUp } from "lucide-react";
import { PushManager } from "@/components/push-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistCard } from "@/components/watchlist-card";
import { WatchlistForm } from "@/components/watchlist-form";
import type { Messages } from "@/get-dictionary";
import type * as schema from "@/lib/db/schema";

type StockAlert = typeof schema.stockAlert.$inferSelect;
type AlertHistory = typeof schema.alertHistory.$inferSelect;

interface DashboardContentProps {
  alerts: StockAlert[];
  history: AlertHistory[];
  dictionary: Messages;
}

export function DashboardContent({
  alerts,
  history,
  dictionary,
}: DashboardContentProps) {
  const activeAlerts = alerts.filter((a) => a.enabled);
  const { dashboard } = dictionary;

  return (
    <div className={`space-y-8`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.totalAlerts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.activeAlerts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.length}</p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.notificationsSent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Alert Form */}
          <WatchlistForm dictionary={dictionary} />

          {/* Watchlist */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {dashboard.watchlistTitle}
              <Badge variant="secondary">{alerts.length}</Badge>
            </h2>

            {alerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{dashboard.noAlertsLine1}</p>
                  <p className="text-sm">{dashboard.noAlertsLine2}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {alerts.map((alert) => (
                  <WatchlistCard
                    key={alert.id}
                    alert={alert}
                    dictionary={dictionary}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Push Notifications */}
          <PushManager dictionary={dictionary} />

          {/* Recent Alert History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {dashboard.recentHistoryTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {dashboard.noHistory}
                </p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 10).map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 text-sm border-b last:border-0 pb-3 last:pb-0"
                    >
                      <div className="p-1.5 rounded bg-primary/5 mt-0.5">
                        <TrendingUp className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{h.stockName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {h.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(h.notifiedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
