"use client";

import { useState } from "react";
import { GRADES } from "@/types";
import PriceInputForm from "@/components/admin/prices/PriceInputForm";
import CorrectionLogTable from "@/components/admin/prices/CorrectionLogTable";
import DataQualityPanel from "@/components/admin/prices/DataQualityPanel";

export default function PricesPage() {
  const [grade, setGrade] = useState("특란");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">실제가격 관리</h1>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <PriceInputForm />
      <CorrectionLogTable />
      <DataQualityPanel grade={grade} />
    </div>
  );
}
