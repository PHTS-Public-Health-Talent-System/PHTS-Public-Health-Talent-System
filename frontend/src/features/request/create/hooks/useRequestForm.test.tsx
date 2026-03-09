import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRequestForm } from "@/features/request/create/hooks/useRequestForm";

const pushMock = vi.fn();
const createRequestMock = vi.fn();
const updateRequestMock = vi.fn();
const submitRequestMock = vi.fn();
const updateRateMappingMock = vi.fn();
const confirmAttachmentsApiMock = vi.fn();
const authUser = {
  role: "PTS_OFFICER",
  firstName: "ละเอียด",
  lastName: "แก้วประเสริฐ",
};
const prefillData = {
  citizen_id: "1570400181863",
  title: "นางสาว",
  first_name: "กันยกร",
  last_name: "กาญจนวัฒนากุล",
  position_name: "พยาบาลวิชาชีพ",
  position_number: "210008",
  department: "กลุ่มงานการพยาบาลผู้ป่วยอายุรกรรม",
  sub_department: "หออภิบาลผู้ป่วยวิกฤตอายุรกรรม (ICU Med.)",
  employee_type: "CIVIL_SERVANT",
  first_entry_date: "2026-03-03",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/features/request/core/hooks", () => ({
  usePrefill: () => ({
    data: prefillData,
  }),
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: authUser,
  }),
}));

vi.mock("@/features/request/core/api", () => ({
  createRequest: (...args: unknown[]) => createRequestMock(...args),
  updateRequest: (...args: unknown[]) => updateRequestMock(...args),
  submitRequest: (...args: unknown[]) => submitRequestMock(...args),
  updateRateMapping: (...args: unknown[]) => updateRateMappingMock(...args),
  confirmAttachments: (...args: unknown[]) => confirmAttachmentsApiMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRequestMock.mockResolvedValue({
      request_id: 999,
      attachments: [],
    });
    updateRequestMock.mockResolvedValue({
      request_id: 999,
      attachments: [],
    });
    confirmAttachmentsApiMock.mockResolvedValue({ confirmed: true });
  });

  it("does not create draft during attachment confirmation for officer on-behalf flow", async () => {
    const { result } = renderHook(() =>
      useRequestForm({
        prefillUserId: 46409,
        returnPath: "/pts-officer/requests",
      }),
    );

    const file = new File(["attachment"], "officer-test.pdf", {
      type: "application/pdf",
    });

    act(() => {
      result.current.handleUploadFile(file);
    });

    let confirmed = false;
    await act(async () => {
      confirmed = await result.current.confirmAttachments();
    });

    expect(confirmed).toBe(true);
    expect(createRequestMock).not.toHaveBeenCalled();
    expect(updateRequestMock).not.toHaveBeenCalled();
    expect(confirmAttachmentsApiMock).not.toHaveBeenCalled();
  });
});
