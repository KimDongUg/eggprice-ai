import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlertForm from "@/components/alerts/AlertForm";

// Wrap component with QueryClientProvider
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("AlertForm", () => {
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    mockOnCreated.mockClear();
  });

  it("renders form title", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    expect(screen.getByText("새 알림 등록")).toBeInTheDocument();
  });

  it("renders email input", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
  });

  it("renders grade select with all grades", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    expect(screen.getByLabelText("등급")).toBeInTheDocument();
    const gradeSelect = screen.getByLabelText("등급") as HTMLSelectElement;
    expect(gradeSelect.options.length).toBe(5);
  });

  it("renders condition select", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    expect(screen.getByLabelText("조건")).toBeInTheDocument();
    const conditionSelect = screen.getByLabelText("조건") as HTMLSelectElement;
    expect(conditionSelect.options.length).toBe(2);
  });

  it("renders price input", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    expect(screen.getByLabelText("기준 가격 (원)")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    expect(screen.getByRole("button", { name: "알림 등록" })).toBeInTheDocument();
  });

  it("updates email input value on change", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    const emailInput = screen.getByLabelText("이메일") as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    expect(emailInput.value).toBe("user@example.com");
  });

  it("updates grade select on change", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    const gradeSelect = screen.getByLabelText("등급") as HTMLSelectElement;
    fireEvent.change(gradeSelect, { target: { value: "특란" } });
    expect(gradeSelect.value).toBe("특란");
  });

  it("updates condition select on change", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    const conditionSelect = screen.getByLabelText("조건") as HTMLSelectElement;
    fireEvent.change(conditionSelect, { target: { value: "below" } });
    expect(conditionSelect.value).toBe("below");
  });

  it("updates price input on change", () => {
    renderWithProviders(<AlertForm onCreated={mockOnCreated} />);
    const priceInput = screen.getByLabelText("기준 가격 (원)") as HTMLInputElement;
    fireEvent.change(priceInput, { target: { value: "6000" } });
    expect(priceInput.value).toBe("6000");
  });
});
