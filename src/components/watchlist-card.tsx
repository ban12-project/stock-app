"use client";

import {
  ArrowUpDown,
  BarChart3,
  Percent,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Messages } from "@/get-dictionary";
import { removeStockAlert, updateStockAlert } from "@/lib/actions/dashboard";
import type * as schema from "@/lib/db/schema";

type StockAlert = typeof schema.stockAlert.$inferSelect;

interface WatchlistCardProps {
  alert: StockAlert;
  dictionary: Messages;
}

export function WatchlistCard({ alert, dictionary }: WatchlistCardProps) {
  const [isPending, startTransition] = useTransition();

  const { card, dashboard, form } = dictionary;

  function handleToggle(enabled: boolean) {
    startTransition(async () => {
      try {
        await updateStockAlert(alert.id, { enabled });
      } catch {
        toast.error(card.updateFailed);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await removeStockAlert(alert.id);
        toast.success(card.removeSuccess.replace("{name}", alert.stockName));
      } catch {
        toast.error(card.removeFailed);
      }
    });
  }

  function getRuleIcon() {
    switch (alert.ruleType) {
      case "price_change_pct":
        return <Percent className="w-4 h-4" />;
      case "price_target":
        return <Target className="w-4 h-4" />;
      case "volume_spike":
        return <BarChart3 className="w-4 h-4" />;
      default:
        return null;
    }
  }

  function getDirectionIcon() {
    switch (alert.ruleDirection) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return <ArrowUpDown className="w-3 h-3 text-blue-500" />;
    }
  }

  function getRuleLabel() {
    switch (alert.ruleType) {
      case "price_change_pct":
        return `${alert.ruleValue}%`;
      case "price_target":
        return `¥${alert.ruleValue}`;
      case "volume_spike":
        return `${alert.ruleValue}×`;
      default:
        return String(alert.ruleValue);
    }
  }

  function getRuleTypeLabel() {
    switch (alert.ruleType) {
      case "price_change_pct":
        return card.typePriceChange;
      case "price_target":
        return card.typePriceTarget;
      case "volume_spike":
        return card.typeVolumeSpike;
      default:
        return alert.ruleType;
    }
  }

  function getIntervalLabel() {
    switch (alert.notifyInterval) {
      case 0:
        return form?.notifyInterval0 || "Always";
      case 5:
        return form?.notifyInterval5 || "5m";
      case 15:
        return form?.notifyInterval15 || "15m";
      case 60:
        return form?.notifyInterval60 || "1h";
      case 1440:
        return form?.notifyInterval1440 || "1d";
      default:
        return `${alert.notifyInterval}m`;
    }
  }

  return (
    <Card className={`transition-all ${!alert.enabled ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{alert.stockName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {alert.stockCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={alert.enabled}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="cursor-pointer"
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={handleDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            {getRuleIcon()}
            {getRuleTypeLabel()}
          </Badge>
          <Badge variant="outline" className="gap-1">
            {getDirectionIcon()}
            {getRuleLabel()}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground gap-1">
            {getIntervalLabel()}
          </Badge>
          {alert.lastPrice && (
            <Badge variant="outline" className="text-muted-foreground">
              {dashboard.last}: ¥{alert.lastPrice}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
