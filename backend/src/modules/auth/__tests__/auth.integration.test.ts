import request from "supertest";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { validate } from "../../../shared/validate.middleware.js";
import { loginSchema } from "../auth.schema.js";
import * as authController from "../auth.controller.js";

// Mocks
// Mocks
jest.mock("../../../shared/utils/validationUtils.js", () => ({
  __esModule: true,
  isValidCitizenId: jest.fn().mockReturnValue(true),
}));

jest.mock("../../../config/database.js", () => ({
  __esModule: true,
  query: jest.fn().mockResolvedValue([]), // Default empty
}));

jest.mock("../../../middlewares/authMiddleware.js", () => ({
  __esModule: true,
  protect: (req: Request, res: Response, next: NextFunction) => next(),
}));

jest.mock("../../audit/services/audit.service.js", () => ({
  __esModule: true,
  logAuditEvent: jest.fn(),
  AuditEventType: {
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
  },
  extractRequestInfo: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  sign: jest.fn().mockReturnValue("mock_token"),
}));

// Setup App
const app = express();
app.use(express.json());
app.post("/api/auth/login", validate(loginSchema), authController.login);

describe("Auth Module Validation (Zod)", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should pass validation for valid payload", async () => {
    // We mock the controller logic to just return for this test,
    // OR we rely on the mocked DB returning empty -> 401, but validation passed.
    // If validation fails, it returns 400.
    // Let's rely on validation pass (Next() called) vs 400.

    // Actually, since we mocked DB to return [], controller will return 401 "Invalid citizen ID or password"
    // This proves validation passed (it didn't return 400).
    const res = await request(app).post("/api/auth/login").send({
      citizen_id: "1234567890123",
      password: "password123",
    });

    expect(res.status).not.toBe(400);
  });

  it("should fail for missing citizen_id", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("body.citizen_id");
  });

  it("should fail for missing password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      citizen_id: "1234567890123",
    });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("body.password");
  });

  it("should fail for invalid citizen_id length (too short)", async () => {
    // Our schema max is 13, but let's check basic requirement.
    // Zod schema: .min(1).max(13).
    // Wait, real validation logic `isValidCitizenId` helps too, currently in controller.
    // But Zod catches basic length if we added .length(13) or similar.
    // Current schema: .max(13).

    // Let's test empty string which Zod catches via .min(1)
    const res = await request(app).post("/api/auth/login").send({
      citizen_id: "",
      password: "pass",
    });

    expect(res.status).toBe(400);
  });
});
