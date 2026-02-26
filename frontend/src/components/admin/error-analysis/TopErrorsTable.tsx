"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { TopErrorItem } from "@/types/admin";

type SortKey = "error_pct" | "target_date" | "actual_price";

export default function TopErrorsTable({ items }: { items: TopErrorItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("error_pct");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...items].sort((a, b) => {
    let va: number, vb: number;
    if (sortKey === "error_pct") {
      va = Math.abs(a.error_pct);
      vb = Math.abs(b.error_pct);
    } else if (sortKey === "target_date") {
      va = new Date(a.target_date).getTime();
      vb = new Date(b.target_date).getTime();
    } else {
      va = a.actual_price;
      vb = b.actual_price;
    }
    return sortAsc ? va - vb : vb - va;
  });

  const arrow = (key: SortKey) => (sortKey === key ? (sortAsc ? " ↑" : " ↓") : "");

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">오차 TOP 50</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">오차 TOP 50</h3>
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-950">
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3 cursor-pointer select-none" onClick={() => handleSort("target_date")}>
                  날짜{arrow("target_date")}
                </th>
                <th className="py-2 pr-3 text-right">예측가</th>
                <th className="py-2 pr-3 text-right cursor-pointer select-none" onClick={() => handleSort("actual_price")}>
                  실제가{arrow("actual_price")}
                </th>
                <th className="py-2 pr-3 text-right cursor-pointer select-none" onClick={() => handleSort("error_pct")}>
                  오차율(%){arrow("error_pct")}
                </th>
                <th className="py-2 text-right">모델</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, i) => (
                <tr key={e.target_date} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-1.5 pr-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5 pr-3">{e.target_date}</td>
                  <td className="py-1.5 pr-3 text-right">{e.predicted_price.toLocaleString()}</td>
                  <td className="py-1.5 pr-3 text-right">{e.actual_price.toLocaleString()}</td>
                  <td className={`py-1.5 pr-3 text-right font-medium ${Math.abs(e.error_pct) > 5 ? "text-red-600" : "text-gray-700"}`}>
                    {e.error_pct > 0 ? "+" : ""}{e.error_pct.toFixed(2)}%
                  </td>
                  <td className="py-1.5 text-right text-xs text-muted-foreground">{e.model_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
