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
  { code: "incheon", name: "인천" },
  { code: "gyeonggi", name: "경기" },
  { code: "chungcheong", name: "충청" },
  { code: "jeolla", name: "전라" },
  { code: "gyeongsang", name: "경상" },
  { code: "gangwon", name: "강원" },
  { code: "jeju", name: "제주" },
];

export default function ComparePage() {
  const [selectedRegion, setSelectedRegion] = useState("seoul");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">가격 비교</h1>
        <p className="text-muted-foreground text-sm">
          소비자가 vs 산지가, 등급 간 가격 차이를 비교 분석합니다.
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
