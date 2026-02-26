// ── Dashboard ──────────────────────────────────────────
export interface KpiCard {
  label: string;
  horizon_days: number;
  mape: number | null;
  prev_mape: number | null;
  trend: "up" | "down" | "flat" | null;
  sample_count: number;
}

export interface AccuracyTrendItem {
  week: string;
  mape: number;
}

export interface ErrorAlertItem {
  target_date: string;
  predicted: number;
  actual: number;
  error_pct: number;
  horizon_days: number;
  model_version: string;
}

export interface AdminDashboardResponse {
  grade: string;
  kpis: KpiCard[];
  accuracy_trend: AccuracyTrendItem[];
  error_alerts: ErrorAlertItem[];
}

// ── Prediction vs Actual ──────────────────────────────
export interface PredVsActualItem {
  target_date: string;
  predicted_price: number;
  actual_price: number | null;
  error: number | null;
  error_pct: number | null;
  model_version: string;
}

export interface PredVsActualResponse {
  grade: string;
  horizon_days: number;
  items: PredVsActualItem[];
}

// ── Market Factor Analysis ────────────────────────────
export interface CorrelationItem {
  factor: string;
  correlation_with_price: number | null;
  correlation_with_error: number | null;
}

export interface ScatterDataItem {
  factor: string;
  factor_value: number;
  price: number;
}

export interface MarketFactorAnalysisResponse {
  grade: string;
  days: number;
  correlations: CorrelationItem[];
  scatter_data: ScatterDataItem[];
}

// ── Model Management ──────────────────────────────────
export interface ModelVersionItem {
  model_version: string;
  grade: string;
  latest_eval_date: string | null;
  avg_mape: number | null;
  is_production: boolean;
  eval_count: number;
}

export interface RetrainRequestCreate {
  grade: string;
  reason?: string;
}

export interface RetrainRequestResponse {
  id: number;
  requested_by: number;
  grade: string;
  reason: string | null;
  status: "pending" | "running" | "completed" | "failed";
  model_version: string | null;
  result_mape: number | null;
  created_at: string;
  completed_at: string | null;
}

// ── Price Management ──────────────────────────────────
export interface ManualPriceInput {
  date: string;
  grade: string;
  wholesale_price: number | null;
  retail_price: number | null;
  reason?: string;
}

export interface PriceCorrectionResponse {
  id: number;
  egg_price_id: number;
  corrected_by: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

export interface DataQualityCheck {
  check_type: "missing" | "outlier" | "gap";
  severity: "warning" | "error";
  date: string | null;
  grade: string | null;
  detail: string;
}

// ── Error Analysis ──────────────────────────────────
export interface TopErrorItem {
  target_date: string;
  predicted_price: number;
  actual_price: number;
  error: number;
  error_pct: number;
  horizon_days: number;
  model_version: string;
}

export interface WeekdayAnalysisItem {
  weekday: number;
  weekday_name: string;
  avg_error_pct: number;
  sample_count: number;
}

export interface MonthlyAnalysisItem {
  month: string;
  mape: number;
  sample_count: number;
}

export interface VolatilityAnalysis {
  volatile_avg_error_pct: number;
  volatile_sample_count: number;
  normal_avg_error_pct: number;
  normal_sample_count: number;
  threshold_pct: number;
}

export interface ErrorAnalysisResponse {
  grade: string;
  horizon_days: number;
  top_errors: TopErrorItem[];
  weekday_analysis: WeekdayAnalysisItem[];
  monthly_analysis: MonthlyAnalysisItem[];
  volatility: VolatilityAnalysis | null;
}
