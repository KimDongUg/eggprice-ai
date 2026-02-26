"use client";

import Link from "next/link";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DataQualitySummary } from "@/types/admin";

export default function DataQualityBanner({ data }: { data: DataQualitySummary | null }) {
  if (!data || (data.error_count === 0 && data.warning_count === 0)) return null;

  const hasErrors = data.error_count > 0;

  return (
    <Card className={hasErrors ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            )}
            <div>
              <h3 className={`text-sm font-semibold ${hasErrors ? "text-red-800" : "text-yellow-800"}`}>
                데이터 품질 알림
                {data.error_count > 0 && (
                  <span className="ml-2 text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                    오류 {data.error_count}건
                  </span>
                )}
                {data.warning_count > 0 && (
                  <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                    경고 {data.warning_count}건
                  </span>
                )}
              </h3>
              <ul className="mt-1.5 space-y-0.5 text-xs text-gray-600">
                {data.recent_issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
          <Link
            href="/admin/prices"
            className="text-xs text-blue-600 hover:underline shrink-0 mt-0.5"
          >
            상세 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
