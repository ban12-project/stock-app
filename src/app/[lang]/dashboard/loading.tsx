import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Overview Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Alert Form Skeleton */}
          <Card className="h-135 bg-muted/10">
            <CardHeader className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-64 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted/50 rounded" />
                </div>
              ))}
              <div className="h-10 w-full bg-muted rounded mt-2" />
            </CardContent>
          </Card>

          {/* Watchlist Skeletons */}
          <div className="space-y-3">
            <div className="h-7 w-40 bg-muted rounded mb-4" />
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-29 bg-muted/5" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Push Notifications Skeleton */}
          <Card className="h-65 bg-muted/10">
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-8 w-20 bg-muted rounded" />
              </div>
              <div className="h-8 w-full bg-muted/50 rounded" />
              <div className="pt-4 border-t space-y-2">
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-24 bg-muted/30 rounded" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Alert History Skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="h-5 w-32 bg-muted rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 border-b last:border-0 pb-4 last:pb-0"
                  >
                    <div className="w-8 h-8 rounded bg-muted mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
