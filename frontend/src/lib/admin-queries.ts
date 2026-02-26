import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axios";
import type {
  AdminDashboardResponse,
  PredVsActualResponse,
  MarketFactorAnalysisResponse,
  ModelVersionItem,
  RetrainRequestCreate,
  RetrainRequestResponse,
  ManualPriceInput,
  PriceCorrectionResponse,
  DataQualityCheck,
  ErrorAnalysisResponse,
  MonthlyComparisonResponse,
} from "@/types/admin";

// ── Dashboard ──────────────────────────────────────────

export function useAdminDashboard(grade: string, periodDays = 90, modelVersion?: string, trendHorizon?: number) {
  return useQuery<AdminDashboardResponse>({
    queryKey: ["admin", "dashboard", grade, periodDays, modelVersion, trendHorizon],
    queryFn: () =>
      api
        .get("/admin/dashboard", {
          params: {
            grade,
            period_days: periodDays,
            ...(modelVersion ? { model_version: modelVersion } : {}),
            ...(trendHorizon ? { trend_horizon: trendHorizon } : {}),
          },
        })
        .then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useModelVersionsList(grade: string) {
  return useQuery<string[]>({
    queryKey: ["admin", "model-versions-list", grade],
    queryFn: () => api.get("/admin/model-versions-list", { params: { grade } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Prediction vs Actual ──────────────────────────────

export function usePredVsActual(grade: string, horizon_days: number, days = 90) {
  return useQuery<PredVsActualResponse>({
    queryKey: ["admin", "pred-vs-actual", grade, horizon_days, days],
    queryFn: () =>
      api.get("/admin/pred-vs-actual", { params: { grade, horizon_days, days } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

// ── Monthly Comparison ───────────────────────────────

export function useMonthlyComparison(grade: string, horizon_days: number, days = 365) {
  return useQuery<MonthlyComparisonResponse>({
    queryKey: ["admin", "monthly-comparison", grade, horizon_days, days],
    queryFn: () =>
      api.get("/admin/monthly-comparison", { params: { grade, horizon_days, days } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Market Factor Analysis ────────────────────────────

export function useMarketFactorAnalysis(grade: string, days = 180) {
  return useQuery<MarketFactorAnalysisResponse>({
    queryKey: ["admin", "market-factors", grade, days],
    queryFn: () =>
      api.get("/admin/market-factors", { params: { grade, days } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Model Management ──────────────────────────────────

export function useAdminModels(grade: string) {
  return useQuery<ModelVersionItem[]>({
    queryKey: ["admin", "models", grade],
    queryFn: () => api.get("/admin/models", { params: { grade } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useRetrainRequests(grade?: string) {
  return useQuery<RetrainRequestResponse[]>({
    queryKey: ["admin", "retrain-requests", grade],
    queryFn: () =>
      api.get("/admin/models/retrain-requests", { params: grade ? { grade } : {} }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useRequestRetrain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RetrainRequestCreate) =>
      api.post("/admin/models/retrain", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "retrain-requests"] });
    },
  });
}

export function usePromoteModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ version, grade }: { version: string; grade: string }) =>
      api.post(`/admin/models/${version}/promote`, null, { params: { grade } }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "models"] });
    },
  });
}

// ── Error Analysis ───────────────────────────────────

export function useErrorAnalysis(grade: string, horizon_days: number, days = 180) {
  return useQuery<ErrorAnalysisResponse>({
    queryKey: ["admin", "error-analysis", grade, horizon_days, days],
    queryFn: () =>
      api.get("/admin/error-analysis", { params: { grade, horizon_days, days } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Price Management ──────────────────────────────────

export function useUpsertPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ManualPriceInput) =>
      api.post("/admin/prices", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDataQuality(grade: string, days = 30) {
  return useQuery<DataQualityCheck[]>({
    queryKey: ["admin", "data-quality", grade, days],
    queryFn: () =>
      api.get("/admin/prices/quality", { params: { grade, days } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useCorrectionLogs(days = 30) {
  return useQuery<PriceCorrectionResponse[]>({
    queryKey: ["admin", "correction-logs", days],
    queryFn: () =>
      api.get("/admin/prices/corrections", { params: { days } }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}
