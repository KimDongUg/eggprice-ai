"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PredVsActualItem } from "@/types/admin";

type SortKey = "target_date" | "error_pct";

export default function ErrorTable({ items }: { items: PredVsActualItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("target_date");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = items.filter((d) => d.actual_price != null);

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "target_date") {
      cmp = a.target_date.localeCompare(b.target_date);
    } else {
      cmp = (Math.abs(a.error_pct ?? 0)) - (Math.abs(b.error_pct ?? 0));
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">오차 상세 테이블</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 cursor-pointer" onClick={() => toggleSort("target_date")}>
                  날짜 {sortKey === "target_date" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th className="pb-2 pr-4">예측</th>
                <th className="pb-2 pr-4">실제</th>
                <th className="pb-2 pr-4">오차</th>
                <th className="pb-2 pr-4 cursor-pointer" onClick={() => toggleSort("error_pct")}>
                  오차율 {sortKey === "error_pct" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th className="pb-2">모델</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4">{row.target_date}</td>
                  <td className="py-2 pr-4">{row.predicted_price.toLocaleString()}원</td>
                  <td className="py-2 pr-4">{row.actual_price?.toLocaleString()}원</td>
                  <td className="py-2 pr-4">{row.error != null ? `${row.error > 0 ? "+" : ""}${row.error.toLocaleString()}` : "-"}</td>
                  <td className="py-2 pr-4 font-medium">{row.error_pct != null ? `${row.error_pct}%` : "-"}</td>
                  <td className="py-2 text-xs text-muted-foreground">{row.model_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">데이터가 없습니다</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
