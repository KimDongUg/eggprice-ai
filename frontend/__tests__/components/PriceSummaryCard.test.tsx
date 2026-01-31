import { render, screen } from "@testing-library/react";
import PriceSummaryCard from "@/components/dashboard/PriceSummaryCard";
import type { PriceWithChange } from "@/types";

const baseData: PriceWithChange = {
  date: "2026-01-31",
  grade: "대란",
  wholesale_price: 5000,
  retail_price: 6000,
  unit: "30개",
  daily_change: null,
  daily_change_pct: null,
};

describe("PriceSummaryCard", () => {
  it("renders grade name", () => {
    render(<PriceSummaryCard data={baseData} />);
    expect(screen.getByText("대란")).toBeInTheDocument();
  });

  it("renders retail price formatted", () => {
    render(<PriceSummaryCard data={baseData} />);
    expect(screen.getByText("6,000")).toBeInTheDocument();
  });

  it("renders wholesale price", () => {
    render(<PriceSummaryCard data={baseData} />);
    expect(screen.getByText("5,000")).toBeInTheDocument();
  });

  it("renders unit", () => {
    render(<PriceSummaryCard data={baseData} />);
    expect(screen.getByText("30개")).toBeInTheDocument();
  });

  it("shows upward change with percentage", () => {
    const data: PriceWithChange = {
      ...baseData,
      daily_change: 100,
      daily_change_pct: 1.67,
    };
    render(<PriceSummaryCard data={data} />);
    expect(screen.getByText(/1\.67%/)).toBeInTheDocument();
  });

  it("shows downward change with percentage", () => {
    const data: PriceWithChange = {
      ...baseData,
      daily_change: -200,
      daily_change_pct: -3.33,
    };
    render(<PriceSummaryCard data={data} />);
    expect(screen.getByText(/3\.33%/)).toBeInTheDocument();
  });

  it("does not render change section when daily_change is null", () => {
    render(<PriceSummaryCard data={baseData} />);
    expect(screen.queryByText(/▲/)).not.toBeInTheDocument();
    expect(screen.queryByText(/▼/)).not.toBeInTheDocument();
  });

  it("does not render price when retail_price is null", () => {
    const data: PriceWithChange = { ...baseData, retail_price: null };
    render(<PriceSummaryCard data={data} />);
    expect(screen.queryByText("원")).not.toBeInTheDocument();
  });
});
