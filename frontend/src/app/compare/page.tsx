"use client";

import { useState } from "react";
import WholesaleRetailChart from "@/components/compare/WholesaleRetailChart";
import GradeComparisonTable from "@/components/compare/GradeComparisonTable";
import PriceHistoryComparison from "@/components/compare/PriceHistoryComparison";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const REGIONS = [
  { code: "seoul", name: "서울" },
  { code: "busan", name: "부산" },
  { code: "daegu", name: "대구" },
  { code: "gwangju", name: "광주" },
  { code: "daejeon", name: "대전" },
];

export default function ComparePage() {
  const [selectedRegion, setSelectedRegion] = useState("seoul");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">가격 비교</h1>
        <p className="text-muted-foreground text-sm">
          등급 간 도매 유통가격 차이를 비교 분석합니다.
        </p>
      </div>

      {/* SEO text description */}
      <div className="bg-gray-50/50 border rounded-xl p-5 text-sm text-muted-foreground leading-relaxed space-y-2">
        <p>
          계란 등급별(왕란·특란·대란·중란·소란) 도매 유통가격 차이를 비교 분석합니다.
          KAMIS(한국농수산식품유통공사)에서 매일 공시하는 전국 도매시장 유통가격 기준이며,
          30개(한 판) 단위의 원화 가격입니다.
        </p>
        <p>
          등급 간 가격 차이는 계란의 무게(왕란 68g 이상 ~ 소란 44g 미만)에 따라 결정되며,
          수급 상황에 따라 격차가 벌어지거나 좁아질 수 있습니다.
          도매가와 소매가의 차이, 과거 가격 추이도 함께 확인할 수 있습니다.
        </p>
      </div>

      {/* 지역 선택 */}
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="h-4 w-4 text-primary-400 shrink-0" />
        <span className="text-sm font-medium">지역:</span>
        {REGIONS.map((region) => (
          <button
            key={region.code}
            onClick={() => setSelectedRegion(region.code)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              selectedRegion === region.code
                ? "bg-primary-400 text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            )}
          >
            {region.name}
          </button>
        ))}
      </div>

      <GradeComparisonTable />
      <WholesaleRetailChart />
      <PriceHistoryComparison />
    </div>
  );
}
