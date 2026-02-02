export interface PriceWithChange {
  date: string;
  grade: string;
  wholesale_price: number | null;
  retail_price: number | null;
  unit: string;
  daily_change: number | null;
  daily_change_pct: number | null;
}

export interface PriceHistory {
  id: number;
  date: string;
  grade: string;
  wholesale_price: number | null;
  retail_price: number | null;
  unit: string;
  created_at: string;
}

export interface Prediction {
  id: number;
  base_date: string;
  target_date: string;
  grade: string;
  predicted_price: number;
  confidence_lower: number;
  confidence_upper: number;
  horizon_days: number;
  model_version: string;
  created_at: string;
}

export interface PredictionSummary {
  grade: string;
  predictions: Prediction[];
}

export interface ForecastItem {
  date: string;
  price: number;
  confidence_interval: [number, number];
  change_percent: number;
}

export interface ForecastResponse {
  grade: string;
  current_price: number | null;
  predictions: ForecastItem[];
  trend: "상승" | "하락" | "보합";
  alert: string | null;
}

export interface Alert {
  id: number;
  email: string;
  phone?: string | null;
  grade: string;
  condition: "above" | "below";
  threshold_price: number;
  notify_email: boolean;
  notify_sms: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AlertCreate {
  email: string;
  phone?: string;
  grade: string;
  condition: "above" | "below";
  threshold_price: number;
  notify_email: boolean;
  notify_sms: boolean;
}

export interface MarketDataSnapshot {
  date: string;
  prices: Record<string, number | null>;
  volume: number | null;
  corn_price: number | null;
  exchange_rate: number | null;
  avian_flu: boolean;
  temperature: number | null;
}

export interface FactorImpact {
  factor: string;
  direction: "상승" | "하락" | "중립";
  description: string;
  value: number | null;
}

export interface AnalyticsFactorsResponse {
  grade: string;
  date: string;
  factors: FactorImpact[];
}

export interface ModelPerformance {
  model_version: string;
  grade: string;
  eval_date: string;
  mae: number;
  rmse: number;
  mape: number;
  directional_accuracy: number;
  is_production: boolean;
  created_at: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const GRADES = ["왕란", "특란", "대란", "중란", "소란"] as const;
export type Grade = (typeof GRADES)[number];
