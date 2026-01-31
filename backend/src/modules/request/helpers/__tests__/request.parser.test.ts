import { parseCreateRequestPayload } from "../request.parser";
import {
  PersonnelType,
  RequestType,
  WorkAttributes,
} from "../../request.types";
import { Request } from "express";

describe("Request Parser", () => {
  const mockFile = (
    fieldname: string,
    originalname: string,
  ): Express.Multer.File => ({
    fieldname,
    originalname,
    encoding: "7bit",
    mimetype: "application/pdf",
    size: 1024,
    destination: "/tmp",
    filename: `test-${fieldname}`,
    path: `/tmp/test-${fieldname}`,
    buffer: Buffer.from("test"),
    stream: null as any,
  });

  it("should parse valid multipart request correctly", () => {
    const mockReq = {
      body: {
        personnel_type: PersonnelType.CIVIL_SERVANT,
        request_type: RequestType.NEW_ENTRY,
        position_number: "123",
        department_group: "ER",
        main_duty: "Nurse",
        requested_amount: "3500",
        effective_date: "2024-01-01",
        work_attributes: JSON.stringify({
          operation: true,
          planning: false,
          coordination: true,
          service: false,
        }),
        submission_data: JSON.stringify({ extra: "data" }),
      },
      files: {
        files: [mockFile("files", "doc1.pdf")],
        license_file: [mockFile("license_file", "license.pdf")],
        applicant_signature: [mockFile("applicant_signature", "sig.png")],
      },
    } as unknown as Request;

    const result = parseCreateRequestPayload(mockReq);

    expect(result.dto.personnel_type).toBe(PersonnelType.CIVIL_SERVANT);
    expect(result.dto.requested_amount).toBe(3500);
    expect(result.dto.work_attributes).toEqual({
      operation: true,
      planning: false,
      coordination: true,
      service: false,
    });
    expect(result.documents).toHaveLength(2); // files + license_file
    expect(result.signature).toBeDefined();
    expect(result.signature?.fieldname).toBe("applicant_signature");
  });

  it("should throw error for missing required fields", () => {
    const mockReq = {
      body: {
        // personnel_type missing
        request_type: RequestType.NEW_ENTRY,
      },
    } as unknown as Request;

    expect(() => parseCreateRequestPayload(mockReq)).toThrow(
      "Missing required fields",
    );
  });

  it("should throw error for valid JSON format failures", () => {
    const mockReq = {
      body: {
        personnel_type: PersonnelType.CIVIL_SERVANT,
        request_type: RequestType.NEW_ENTRY,
        work_attributes: "{ invalid json }",
      },
    } as unknown as Request;

    expect(() => parseCreateRequestPayload(mockReq)).toThrow(
      "Invalid work_attributes format",
    );
  });

  it("should handle missing files gracefully", () => {
    const mockReq = {
      body: {
        personnel_type: PersonnelType.CIVIL_SERVANT,
        request_type: RequestType.NEW_ENTRY,
      },
    } as unknown as Request;

    const result = parseCreateRequestPayload(mockReq);
    expect(result.documents).toEqual([]);
    expect(result.signature).toBeUndefined();
  });
});
