import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { ActionType, PersonnelType, RequestType } from "../../request.types.js";
import { errorHandler } from "../../../../middlewares/errorHandler.js";
import { classifyEmployee } from "../../classification/classification.service.js";

// Setup Mocks BEFORE imports
const mockQuery = jest
  .fn()
  .mockResolvedValue([[{ citizen_id: "1234567890123" }]]);

jest.mock("../../../../middlewares/authMiddleware.js", () => ({
  __esModule: true,
  protect: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      userId: 1,
      role: "USER",
      citizenId: "1234567890123",
    };
    next();
  },
  restrictTo:
    (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      next();
    },
}));

jest.mock("../../../../config/upload.js", () => ({
  __esModule: true,
  requestUpload: {
    fields: () => (req: Request, res: Response, next: NextFunction) => {
      req.files = {};
      next();
    },
  },
  handleUploadError: jest.fn(),
  MAX_SIGNATURE_SIZE: 5 * 1024 * 1024,
}));

jest.mock("../../../../config/database.js", () => ({
  __esModule: true,
  default: {
    query: mockQuery,
  },
  query: mockQuery,
  getConnection: jest.fn(),
}));

jest.mock("../../services/command.service.js", () => ({
  __esModule: true,
  requestCommandService: {
    createRequest: jest.fn().mockResolvedValue({ request_id: 100 }),
    updateRequest: jest.fn().mockResolvedValue({ request_id: 100 }),
  }
}));

jest.mock("../../services/approval.service.js", () => ({
  __esModule: true,
  requestApprovalService: {
    approveRequest: jest.fn().mockResolvedValue({ success: true }),
    rejectRequest: jest.fn().mockResolvedValue({ success: true }),
    returnRequest: jest.fn().mockResolvedValue({ success: true }),
  }
}));

jest.mock("../../classification/classification.service.js", () => ({
  __esModule: true,
  classifyEmployee: jest.fn().mockResolvedValue({ rate_amount: 1000 }),
}));

jest.mock("../../../notification/services/notification.service.js", () => ({
  __esModule: true,
  NotificationService: {
    notifyUser: jest.fn(),
  },
}));

// Import App
import requestRoutes from "../../request.routes.js";

const app = express();
app.use(express.json());
app.use("/api/requests", requestRoutes);
app.use(errorHandler);

describe("Request Module Validation (Zod)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    process.env.NODE_ENV = "production";
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/requests (Create Request)", () => {
    it("should pass validation for valid payload", async () => {
      await request(app)
        .post("/api/requests")
        .send({
          personnel_type: PersonnelType.CIVIL_SERVANT,
          request_type: RequestType.NEW_ENTRY,
          requested_amount: 1000,
          work_attributes: JSON.stringify({
            operation: true,
            planning: false,
            coordination: false,
            service: false,
          }),
        })
        .expect(201);
    });

    it("should not require pre-classification before create", async () => {
      (classifyEmployee as jest.Mock).mockResolvedValueOnce(null);

      await request(app)
        .post("/api/requests")
        .send({
          personnel_type: PersonnelType.CIVIL_SERVANT,
          request_type: RequestType.NEW_ENTRY,
          requested_amount: 1000,
          work_attributes: JSON.stringify({
            operation: true,
            planning: false,
            coordination: false,
            service: false,
          }),
        })
        .expect(201);
    });

    it("should pass validation when work_attributes is object (JSON body)", async () => {
      await request(app)
        .post("/api/requests")
        .send({
          personnel_type: PersonnelType.CIVIL_SERVANT,
          request_type: RequestType.NEW_ENTRY,
          requested_amount: 1000,
          work_attributes: {
            operation: true,
            planning: false,
            coordination: false,
            service: false,
          },
        })
        .expect(201);
    });

    it("should fail for missing personnel_type", async () => {
      const res = await request(app).post("/api/requests").send({
        request_type: RequestType.NEW_ENTRY,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(
        res.body.error.details?.errors?.body?.personnel_type,
      ).toBeDefined();
    });

    it("should fail for invalid enum value", async () => {
      const res = await request(app).post("/api/requests").send({
        personnel_type: "INVALID_TYPE",
        request_type: RequestType.NEW_ENTRY,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(
        res.body.error.details?.errors?.body?.personnel_type,
      ).toBeDefined();
    });
  });

  describe("POST /api/requests/:id/action", () => {
    it("should pass validation for valid APPROVE", async () => {
      await request(app)
        .post("/api/requests/1/action")
        .send({ action: "APPROVE", comment: "OK" })
        .expect(200);
    });

    it("should fail for action CANCEL", async () => {
      const res = await request(app)
        .post("/api/requests/1/action")
        .send({ action: "CANCEL", comment: "No" });

      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe("body.action");
    });

    it("should fail for invalid action", async () => {
      const res = await request(app)
        .post("/api/requests/1/action")
        .set("x-user-id", "99") // ID
        .set("x-role", "HEAD_WARD") // Role
        .set("x-citizen-id", "TEST_CITIZEN") // Citizen ID
        .send({ action: "DANCE", comment: "Cha Cha Cha" });

      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe("body.action");
    });
  });
});
