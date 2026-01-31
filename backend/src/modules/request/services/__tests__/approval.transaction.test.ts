import { requestApprovalService } from "../approval.service.js";
import { NotificationService } from "../../../notification/services/notification.service.js";
import db from "../../../../config/database.js";

jest.mock("../../../../config/database.js", () => {
  const mockGetConnection = jest.fn();
  const mockPool = {
    getConnection: mockGetConnection,
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockPool,
    getConnection: mockGetConnection,
  };
});

jest.mock("../../scope/scope.service.js", () => ({
  canApproverAccessRequest: jest.fn().mockResolvedValue(true),
  canSelfApprove: jest.fn().mockReturnValue(false),
  isRequestOwner: jest.fn().mockReturnValue(false),
}));

jest.mock("../../../notification/services/notification.service.js");
jest.mock("../../../audit/services/audit.service.js", () => ({
  logAuditEvent: jest.fn(),
  AuditEventType: { REQUEST_REJECT: "REQUEST_REJECT" },
}));

describe("ApprovalService Transaction Safety", () => {
  const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (db.getConnection as jest.Mock).mockResolvedValue(mockConnection);
    // Mock user lookup/request lookup
    mockConnection.query.mockImplementation((sql) => {
      if (sql.includes("req_submissions")) {
        return [
          [
            {
              request_id: 123,
              request_no: "REQ-001",
              user_id: 99,
              current_step: 1,
              status: "PENDING",
              emp_department: "DEPT",
              emp_sub_department: "SUB",
            },
          ],
          [],
        ];
      }
      return [[], []];
    });
  });

  it("should pass transaction connection to NotificationService", async () => {
    // Act
    try {
      await requestApprovalService.rejectRequest(123, 1, "HEAD_WARD", "Test Reject");
    } catch {
      // ignore to allow assertions on transaction wiring
    }

    // Assert
    // Check if notifyUser was called with the connection object as the last argument
    expect(NotificationService.notifyUser).toHaveBeenCalled();
    const lastCallArgs = (NotificationService.notifyUser as jest.Mock).mock
      .calls[0];
    const connectionArg = lastCallArgs[lastCallArgs.length - 1]; // Last arg should be connection

    expect(connectionArg).toBe(mockConnection);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
  });
});
