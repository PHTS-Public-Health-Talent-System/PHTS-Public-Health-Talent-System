import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: vi.fn(actual.useState),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/thai-date-field", () => ({
  ThaiDateField: (props: Record<string, unknown>) => <input data-testid="thai-date-field" {...props} />,
}));

vi.mock("@/components/person-picker", () => ({
  PersonPicker: () => <div data-testid="person-picker" />,
}));

vi.mock("@/features/personnel-changes/hooks", () => {
  const mutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };
  return {
    useCreatePersonnelMovement: () => mutation,
    useCreateRetirement: () => mutation,
    useDeletePersonnelMovement: () => mutation,
    useDeleteRetirement: () => mutation,
    usePersonnelMovements: () => ({ data: [], isLoading: false }),
    useRetirements: () => ({ data: [], isLoading: false }),
    useUpdatePersonnelMovement: () => mutation,
    useUpdateRetirement: () => mutation,
  };
});

vi.mock("@/features/request", () => ({
  useEligibilityList: () => ({
    data: [],
    isLoading: false,
  }),
}));

import PersonnelChangesPage from "./page";
import { useState } from "react";

describe("PersonnelChangesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders delete alert without dialog context errors", () => {
    const selectedChange = {
      id: "movement-1",
      sourceType: "movement",
      sourceId: 1,
      personId: "1234567890123",
      personName: "ทดสอบ ระบบ",
      personPosition: "พยาบาลวิชาชีพ",
      personDepartment: "กลุ่มงานการพยาบาล",
      profession: "พยาบาล",
      changeType: "resign",
      effectiveDate: "2026-03-01",
      fiscalYear: 2569,
      status: "pending",
      notifiedAt: "2026-03-01",
    };

    const mockedUseState = useState as unknown as Mock;
    const actualUseState = (value: unknown) =>
      [typeof value === "function" ? (value as () => unknown)() : value, vi.fn()] as const;

    mockedUseState
      .mockImplementationOnce(() => actualUseState(""))
      .mockImplementationOnce(() => actualUseState("all"))
      .mockImplementationOnce(() => actualUseState("all"))
      .mockImplementationOnce(() => actualUseState("all"))
      .mockImplementationOnce(() => actualUseState(false))
      .mockImplementationOnce(() => actualUseState(false))
      .mockImplementationOnce(() => actualUseState(false))
      .mockImplementationOnce(() => actualUseState(true))
      .mockImplementationOnce(() => actualUseState(false))
      .mockImplementationOnce(() => actualUseState(""))
      .mockImplementationOnce(() => actualUseState(selectedChange))
      .mockImplementationOnce(() => actualUseState("all"));

    expect(() => render(<PersonnelChangesPage />)).not.toThrow();
  });
});
