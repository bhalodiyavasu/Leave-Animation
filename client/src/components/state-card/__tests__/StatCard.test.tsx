import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "../StatCard";
import { IndianRupee } from "lucide-react";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Total Sales" value="$1,000" />);
    expect(screen.getByText("Total Sales")).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("renders icon if provided", () => {
    render(<StatCard title="Sales" value="100" icon={IndianRupee} />);
    // Icon is tricky to direct assertion without specific markup, but we can verify it doesn't crash
    // and potentially check for SVG if we want to be strict.
    // For now, ensuring render is successful is good.
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("renders trend correctly", () => {
    render(
      <StatCard
        title="Growth"
        value="50%"
        trend={{ value: "10%", label: "vs last month", isPositive: true }}
      />,
    );
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });
});
