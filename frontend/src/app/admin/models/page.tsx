"use client";

import { useState } from "react";
import { useAdminModels } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADES } from "@/types";
import ModelVersionTable from "@/components/admin/models/ModelVersionTable";
import ModelComparisonChart from "@/components/admin/models/ModelComparisonChart";
import RetrainRequestForm from "@/components/admin/models/RetrainRequestForm";

export default function ModelsPage() {
  const [grade, setGrade] = useState("대란");
  const { data: models, isLoading } = useAdminModels(grade);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">모델 관리</h1>
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

      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : models ? (
        <>
          <ModelComparisonChart models={models} />
          <ModelVersionTable models={models} grade={grade} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}

      <RetrainRequestForm />
    </div>
  );
}
