import {
  BarChart3,
  Bell,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAlertHistory } from "@/lib/actions/dashboard";

function getRuleIcon(ruleType: string) {
  switch (ruleType) {
    case "price_change_pct":
      return <TrendingUp className="w-4 h-4" />;
    case "price_target":
      return <Target className="w-4 h-4" />;
    case "volume_spike":
      return <BarChart3 className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">History of all triggered alerts</p>
      </div>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryList />
      </Suspense>
    </div>
  );
}

async function HistoryList() {
  const history = await getAlertHistory();

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm mt-1">
            Alerts will appear here when your stock rules trigger
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <Card key={item.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/5 mt-0.5">
                {getRuleIcon(item.ruleType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{item.stockName}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {item.stockCode}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Price: ¥{item.currentPrice.toFixed(2)}</span>
                  <span>•</span>
                  <span>
                    {new Date(item.notifiedAt).toLocaleString("zh-CN")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {item.currentPrice > item.triggerValue ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="h-20 animate-pulse bg-muted/50" />
      ))}
    </div>
  );
}
