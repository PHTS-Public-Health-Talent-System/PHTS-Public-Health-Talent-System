/**
 * PHTS System - Data Quality Routes
 *
 * API routes for data quality operations.
 * Per Access_Control_Matrix.txt Line 182: PTS_OFFICER เท่านั้น
 */

import { Router } from "express";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";
import { validate } from "../../shared/validate.middleware.js";
import { UserRole } from "../../types/auth.js";
import * as dataQualityController from "./data-quality.controller.js";
import {
  getIssuesSchema,
  createIssueSchema,
  updateIssueSchema,
} from "./data-quality.schema.js";

const router = Router();

/**
 * All routes require authentication
 */
router.use(protect);

/**
 * Data Quality access is restricted to PTS_OFFICER only
 */

// Get dashboard
router.get(
  "/dashboard",
  restrictTo(UserRole.PTS_OFFICER),
  dataQualityController.getDashboard,
);

// Get summary
router.get(
  "/summary",
  restrictTo(UserRole.PTS_OFFICER),
  dataQualityController.getSummary,
);

// Get issue types
router.get(
  "/types",
  restrictTo(UserRole.PTS_OFFICER),
  dataQualityController.getIssueTypes,
);

// Get issues with filters
router.get(
  "/issues",
  restrictTo(UserRole.PTS_OFFICER),
  validate(getIssuesSchema),
  dataQualityController.getIssues,
);

// Create a new issue (report)
router.post(
  "/issues",
  restrictTo(UserRole.PTS_OFFICER),
  validate(createIssueSchema),
  dataQualityController.createIssue,
);

// Update issue status
router.put(
  "/issues/:id",
  restrictTo(UserRole.PTS_OFFICER),
  validate(updateIssueSchema),
  dataQualityController.updateIssue,
);

// Run checks and auto-resolve (PTS_OFFICER only)
router.post(
  "/run-checks",
  restrictTo(UserRole.PTS_OFFICER),
  dataQualityController.runChecks,
);
router.post(
  "/auto-resolve",
  restrictTo(UserRole.PTS_OFFICER),
  dataQualityController.autoResolve,
);

export default router;
