import { render, screen } from "@testing-library/react";
import { User } from "lucide-react";
import { describe, expect, it } from "vitest";
import { EntitySummaryCard } from "@/components/common/entity-summary-card";

describe("EntitySummaryCard", () => {
  it("renders block content without nesting div inside paragraph", () => {
    const { container } = render(
      <EntitySummaryCard
        title="ข้อมูลผู้ยื่น"
        icon={User}
        fields={[
          {
            label: "ชื่อ-นามสกุล",
            value: <div data-testid="changed-value">ทดสอบ</div>,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("changed-value")).toBeInTheDocument();
    expect(container.querySelector("p > div")).toBeNull();
  });
});
