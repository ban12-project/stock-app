"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useDebounceCallback } from "usehooks-ts";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { Messages } from "@/get-dictionary";
import { searchStocksAction } from "@/lib/actions/dashboard";
import type { SearchResult } from "@/lib/qq-finance/types";

interface StockSearchProps {
  value: SearchResult | null;
  onSelect: (stock: SearchResult | null) => void;
  dictionary: Messages;
}

export function StockSearch({ value, onSelect, dictionary }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { search } = dictionary;

  const debouncedSearch = useDebounceCallback(async (val: string) => {
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    startTransition(async () => {
      try {
        const data = await searchStocksAction(val);
        if (controller.signal.aborted) return;
        setResults(data.results ?? []);
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
      }
    });
  }, 300);

  const items = useMemo(() => {
    if (
      !value ||
      results.some((s) => s.market === value.market && s.code === value.code)
    ) {
      return results;
    }
    return [...results, value];
  }, [results, value]);

  return (
    <Combobox
      value={value}
      onValueChange={(val: SearchResult | null) => {
        onSelect(val);
        setQuery("");
        setResults(val ? [val] : []);
      }}
      inputValue={query}
      onInputValueChange={(val: string, { reason }) => {
        setQuery(val);

        if (val === "" || reason === "item-press") {
          setResults([]);
          return;
        }

        debouncedSearch(val);
      }}
      onOpenChangeComplete={(open) => {
        if (!open && value) {
          setResults([value]);
        }
      }}
      itemToStringLabel={(stock: SearchResult) => stock?.name ?? ""}
      items={items}
      filter={null}
    >
      <div className="relative">
        <ComboboxInput
          placeholder={search.placeholder}
          showTrigger={false}
          showClear={!!value}
          className="w-full"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground z-10" />
        )}
      </div>

      <ComboboxContent>
        <ComboboxEmpty>
          {isPending ? "Searching..." : "Try a different search term."}
        </ComboboxEmpty>
        <ComboboxList>
          {(stock: SearchResult) => (
            <ComboboxItem
              key={`${stock.market}-${stock.code}`}
              value={stock}
              className="flex items-center justify-between"
            >
              <div>
                <span className="font-medium">{stock.name}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {stock.code}
                </span>
              </div>
              <span className="text-xs text-muted-foreground uppercase">
                {stock.market === "sh"
                  ? search.marketSH
                  : stock.market === "sz"
                    ? search.marketSZ
                    : stock.market}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
