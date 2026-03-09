import { render } from "@testing-library/react";
import { Landmark } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SummaryMetricCard } from "./summary-metric-card";

describe("SummaryMetricCard", () => {
  it("keeps horizontal cards inline by default", () => {
    const { container } = render(
      <SummaryMetricCard
        icon={Landmark}
        title="ยอดรวม"
        value="100"
        iconClassName="text-primary"
        iconBgClassName="bg-primary/10"
        layout="horizontal"
      />,
    );

    const content = container.querySelector(".p-4");
    expect(content?.className).toContain("gap-4");
    expect(content?.className).not.toContain("justify-between");
  });

  it("pushes the icon to the right edge when requested", () => {
    const { container } = render(
      <SummaryMetricCard
        icon={Landmark}
        title="ยอดรวม"
        value="100"
        iconClassName="text-primary"
        iconBgClassName="bg-primary/10"
        layout="horizontal"
        iconPlacement="edge"
      />,
    );

    const content = container.querySelector(".p-4");
    expect(content?.className).toContain("justify-between");
  });
});
