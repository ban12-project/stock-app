"use client";

import { Loader2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Messages } from "@/get-dictionary";
import { addStockAlert } from "@/lib/actions/dashboard";
import type { SearchResult } from "@/lib/qq-finance/types";

import { StockSearch } from "./stock-search";

interface WatchlistFormProps {
  dictionary: Messages;
}

export function WatchlistForm({ dictionary }: WatchlistFormProps) {
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [ruleType, setRuleType] = useState("price_change_pct");
  const [ruleDirection, setRuleDirection] = useState("both");
  const [ruleValue, setRuleValue] = useState("");
  const [notifyInterval, setNotifyInterval] = useState("0");
  const [isPending, startTransition] = useTransition();

  const { form } = dictionary;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStock || !ruleValue) return;

    startTransition(async () => {
      try {
        await addStockAlert({
          stockCode: `${selectedStock.market}${selectedStock.code}`,
          stockName: selectedStock.name,
          market: selectedStock.market,
          ruleType,
          ruleDirection,
          ruleValue: parseFloat(ruleValue),
          notifyInterval: parseInt(notifyInterval, 10),
        });
        toast.success(form.addedSuccess.replace("{name}", selectedStock.name));
        setSelectedStock(null);
        setRuleValue("");
        setNotifyInterval("0");
      } catch {
        toast.error(form.addedFailed);
      }
    });
  }

  function getRuleDescription() {
    switch (ruleType) {
      case "price_change_pct":
        return form.descPriceChange;
      case "price_target":
        return form.descPriceTarget;
      case "volume_spike":
        return form.descVolumeSpike;
      default:
        return "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {form.title}
        </CardTitle>
        <CardDescription>{form.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Search */}
          <div className="space-y-2">
            <Label>{form.stockLabel}</Label>
            <StockSearch
              value={selectedStock}
              onSelect={setSelectedStock}
              dictionary={dictionary}
            />
          </div>

          {/* Rule Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{form.ruleTypeLabel}</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_change_pct">
                    {form.ruleTypePriceChange}
                  </SelectItem>
                  <SelectItem value="price_target">
                    {form.ruleTypePriceTarget}
                  </SelectItem>
                  <SelectItem value="volume_spike">
                    {form.ruleTypeVolumeSpike}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{form.directionLabel}</Label>
              <Select value={ruleDirection} onValueChange={setRuleDirection}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">{form.dirUp}</SelectItem>
                  <SelectItem value="down">{form.dirDown}</SelectItem>
                  <SelectItem value="both">{form.dirBoth}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rule Value */}
          <div className="space-y-2">
            <Label>
              {form.thresholdLabel}{" "}
              <span className="text-muted-foreground font-normal">
                (
                {ruleType === "price_change_pct"
                  ? "%"
                  : ruleType === "price_target"
                    ? "¥"
                    : "×"}
                )
              </span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={
                ruleType === "price_change_pct"
                  ? "e.g. 5"
                  : ruleType === "price_target"
                    ? "e.g. 1800"
                    : "e.g. 2"
              }
              value={ruleValue}
              onChange={(e) => setRuleValue(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {getRuleDescription()}
            </p>
          </div>

          {/* Notify Interval */}
          <div className="space-y-2">
            <Label>{form.notifyIntervalLabel}</Label>
            <Select value={notifyInterval} onValueChange={setNotifyInterval}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{form.notifyInterval0}</SelectItem>
                <SelectItem value="5">{form.notifyInterval5}</SelectItem>
                <SelectItem value="15">{form.notifyInterval15}</SelectItem>
                <SelectItem value="60">{form.notifyInterval60}</SelectItem>
                <SelectItem value="1440">{form.notifyInterval1440}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isPending || !selectedStock || !ruleValue}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {form.addAlertBtn}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
