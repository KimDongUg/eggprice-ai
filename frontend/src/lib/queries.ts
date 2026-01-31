import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axios";
import type {
  PriceWithChange,
  PriceHistory,
  PredictionSummary,
  ForecastResponse,
  Alert,
  AlertCreate,
  MarketDataSnapshot,
  ModelPerformance,
  AnalyticsFactorsResponse,
  UserResponse,
} from "@/types";

// ── Prices ──────────────────────────────────────────

export function useCurrentPrices() {
  return useQuery<PriceWithChange[]>({
    queryKey: ["prices", "current"],
    queryFn: () => api.get("/prices/current").then((r) => r.data),
    staleTime: 3 * 60 * 1000,
  });
}

export function usePriceHistory(grade: string, days = 180) {
  return useQuery<PriceHistory[]>({
    queryKey: ["prices", "history", grade, days],
    queryFn: () =>
      api
        .get("/prices/history", { params: { grade, days } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Predictions ─────────────────────────────────────

export function useForecast(grade: string) {
  return useQuery<ForecastResponse>({
    queryKey: ["forecast", grade],
    queryFn: () =>
      api
        .get("/predictions/forecast", { params: { grade } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePredictions(grade: string) {
  return useQuery<PredictionSummary>({
    queryKey: ["predictions", grade],
    queryFn: () =>
      api.get(`/predictions/${encodeURIComponent(grade)}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshPredictions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/predictions/refresh").then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
  });
}

// ── Alerts ──────────────────────────────────────────

export function useAlerts(email: string) {
  return useQuery<Alert[]>({
    queryKey: ["alerts", email],
    queryFn: () => api.get("/alerts", { params: { email } }).then((r) => r.data),
    enabled: !!email,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AlertCreate) =>
      api.post("/alerts", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// ── Market Data ─────────────────────────────────────

export function useMarketSnapshot(date?: string) {
  return useQuery<MarketDataSnapshot>({
    queryKey: ["market", "snapshot", date],
    queryFn: () =>
      api
        .get("/market/snapshot", { params: date ? { target_date: date } : {} })
        .then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAnalyticsFactors(grade: string) {
  return useQuery<AnalyticsFactorsResponse>({
    queryKey: ["analytics", "factors", grade],
    queryFn: () =>
      api
        .get("/analytics/factors", { params: { grade } })
        .then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Model Performance ───────────────────────────────

export function useModelPerformance(grade: string) {
  return useQuery<ModelPerformance[]>({
    queryKey: ["models", "performance", grade],
    queryFn: () =>
      api
        .get("/models/performance", { params: { grade } })
        .then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCurrentModel(grade: string) {
  return useQuery<ModelPerformance | null>({
    queryKey: ["models", "current", grade],
    queryFn: () =>
      api.get("/models/current", { params: { grade } }).then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });
}

// ── Auth ────────────────────────────────────────────

export function useMe() {
  return useQuery<UserResponse>({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post("/auth/login", data).then((r) => r.data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      api.post("/auth/register", data).then((r) => r.data),
  });
}
