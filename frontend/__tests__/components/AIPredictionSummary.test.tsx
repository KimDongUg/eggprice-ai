import { render, screen } from "@testing-library/react";
import AIPredictionSummary from "@/components/dashboard/AIPredictionSummary";
import type { ForecastResponse } from "@/types";

const makeForecast = (
  trend: "상승" | "하락" | "보합" = "상승"
): ForecastResponse => ({
  grade: "대란",
  current_price: 6000,
  predictions: [
    { date: "2026-02-07", price: 6200, confidence_interval: [6000, 6400], change_percent: 3.33 },
    { date: "2026-02-14", price: 6400, confidence_interval: [6100, 6700], change_percent: 6.67 },
    { date: "2026-03-02", price: 6600, confidence_interval: [6200, 7000], change_percent: 10.0 },
  ],
  trend,
  alert: "조류독감 주의보가 발령 중입니다.",
});

describe("AIPredictionSummary", () => {
  it("renders grade label", () => {
    render(<AIPredictionSummary data={makeForecast()} />);
    expect(screen.getByText(/대란 기준/)).toBeInTheDocument();
  });

  it("renders trend badge", () => {
    render(<AIPredictionSummary data={makeForecast("상승")} />);
    expect(screen.getByText("상승")).toBeInTheDocument();
  });

  it("renders all three horizon labels", () => {
    render(<AIPredictionSummary data={makeForecast()} />);
    expect(screen.getByText("7일 후:")).toBeInTheDocument();
    expect(screen.getByText("14일 후:")).toBeInTheDocument();
    expect(screen.getByText("30일 후:")).toBeInTheDocument();
  });

  it("renders prediction prices", () => {
    render(<AIPredictionSummary data={makeForecast()} />);
    expect(screen.getByText(/6,200원/)).toBeInTheDocument();
    expect(screen.getByText(/6,400원/)).toBeInTheDocument();
    expect(screen.getByText(/6,600원/)).toBeInTheDocument();
  });

  it("renders alert text when present", () => {
    render(<AIPredictionSummary data={makeForecast()} />);
    expect(
      screen.getByText("조류독감 주의보가 발령 중입니다.")
    ).toBeInTheDocument();
  });

  it("does not render alert section when null", () => {
    const data = { ...makeForecast(), alert: null };
    render(<AIPredictionSummary data={data} />);
    expect(
      screen.queryByText("조류독감 주의보가 발령 중입니다.")
    ).not.toBeInTheDocument();
  });

  it("shows buy recommendation for 상승 trend", () => {
    render(<AIPredictionSummary data={makeForecast("상승")} />);
    expect(
      screen.getByText("가격 상승이 예상됩니다. 지금이 구매 적기입니다!")
    ).toBeInTheDocument();
  });

  it("shows wait recommendation for 하락 trend", () => {
    render(<AIPredictionSummary data={makeForecast("하락")} />);
    expect(
      screen.getByText("가격 하락이 예상됩니다. 조금 더 기다려보세요.")
    ).toBeInTheDocument();
  });

  it("shows stable recommendation for 보합 trend", () => {
    render(<AIPredictionSummary data={makeForecast("보합")} />);
    expect(
      screen.getByText("가격이 안정세를 보이고 있습니다.")
    ).toBeInTheDocument();
  });
});
