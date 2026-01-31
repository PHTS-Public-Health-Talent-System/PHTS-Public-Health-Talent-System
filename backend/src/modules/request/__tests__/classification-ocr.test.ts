import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../../middlewares/errorHandler.js";

const mockQuery = jest.fn();
const mockFindRecommendedRate = jest.fn();
const mockGetOcrTextForRequest = jest.fn();

jest.mock("../../../middlewares/authMiddleware.js", () => ({
  __esModule: true,
  protect: (req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      userId: 1,
      role: "USER",
      citizenId: "1234567890123",
    };
    next();
  },
  restrictTo: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
}));

jest.mock("../../../config/upload.js", () => ({
  __esModule: true,
  requestUpload: {
    fields: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  },
  handleUploadError: jest.fn(),
  MAX_SIGNATURE_SIZE: 5 * 1024 * 1024,
}));

jest.mock("../../../config/database.js", () => ({
  __esModule: true,
  default: {
    query: (...args: any[]) => mockQuery(...args),
  },
  query: (...args: any[]) => mockQuery(...args),
}));

jest.mock("../classification/classification.service.js", () => {
  // Mock the new location of the service
  const service = jest.requireActual("../classification/classification.service.js"); // Correct path
  return {
    __esModule: true,
    findRecommendedRate: mockFindRecommendedRate,
    getAllActiveMasterRates: jest.fn(),
  };
});

jest.mock("../ocr/ocr.service.js", () => ({
  __esModule: true,
  getOcrTextForRequest: (...args: any[]) => mockGetOcrTextForRequest(...args),
  isOcrEnabled: jest.fn(() => true),
  processAttachmentOcr: jest.fn(),
}));

const mockGetRequestById = jest.fn();
const mockUpdateClassification = jest.fn();

jest.mock("../services/query.service.js", () => ({
  __esModule: true,
  requestQueryService: {
    getRequestById: (...args: any[]) => mockGetRequestById(...args),
  },
}));

jest.mock("../services/command.service.js", () => ({
  __esModule: true,
  requestCommandService: {
    updateClassification: (...args: any[]) => mockUpdateClassification(...args),
    createRequest: jest.fn(),
  },
}));

import requestRoutes from "../request.routes.js";

const app = express();
app.use(express.json());
app.use("/api/requests", requestRoutes);
app.use(errorHandler);

describe("Request Classification with OCR", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns recommended classification using OCR text", async () => {
    mockGetRequestById.mockResolvedValueOnce({
      request_id: 123, user_id: 1, citizen_id: "1234567890123",
    });
    mockGetOcrTextForRequest.mockResolvedValue("ocr text");
    mockFindRecommendedRate.mockResolvedValue({
      rate_id: 9,
      profession_code: "DOCTOR",
      group_no: 2,
      item_no: "2.1",
      sub_item_no: "2",
      amount: 10000,
    });

    const res = await request(app)
      .get("/api/requests/123/recommended-classification")
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      source: "OCR",
      group_no: 2,
      item_no: "2.1",
      sub_item_no: "2",
      rate_id: 9,
      amount: 10000,
      profession_code: "DOCTOR",
      hint_text: "มีแนวโน้มเข้าข่ายกลุ่ม 2 ข้อ 2.1 ข้อย่อย 2",
    });
  });

  it("updates classification and sets requested_amount from rates", async () => {
    mockUpdateClassification.mockResolvedValueOnce({
      request_id: 123,
      rate_id: 5,
      amount: 15000,
      group_no: 3,
      item_no: "3.4",
      sub_item_no: null,
    });

    const res = await request(app)
      .post("/api/requests/123/classification")
      .send({ group_no: 3, item_no: "3.4", sub_item_no: null });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      request_id: 123,
      rate_id: 5,
      amount: 15000,
      group_no: 3,
      item_no: "3.4",
      sub_item_no: null,
    });
  });
});
