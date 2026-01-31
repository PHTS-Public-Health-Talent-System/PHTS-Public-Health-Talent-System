/**
 * PHTS System - Delegation Routes
 *
 * API routes for delegation operations.
 */

import { Router } from "express";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";
import { validate } from "../../shared/validate.middleware.js";
import { UserRole } from "../../types/auth.js";
import * as delegationController from "./delegation.controller.js";
import {
  createDelegationSchema,
  cancelDelegationSchema,
  getMyDelegationsSchema,
  checkCanActSchema,
  searchCandidatesSchema,
} from "./delegation.schema.js";

const router = Router();

/**
 * All routes require authentication
 */
router.use(protect);

// Get delegations for current user (any authenticated user)
router.get(
  "/my",
  validate(getMyDelegationsSchema),
  delegationController.getMyDelegations,
);

// Get active acting roles for current user
router.get("/acting", delegationController.getActingRoles);

// Check if can act as a role
router.get(
  "/check/:role",
  validate(checkCanActSchema),
  delegationController.checkCanAct,
);

// Search candidates (any authenticated user)
router.get(
  "/candidates",
  validate(searchCandidatesSchema),
  delegationController.searchCandidates,
);

// Create a new delegation (approver roles only)
router.post(
  "/",
  restrictTo(
    UserRole.HEAD_WARD,
    UserRole.HEAD_DEPT,
    UserRole.PTS_OFFICER,
    UserRole.HEAD_HR,
    UserRole.HEAD_FINANCE,
    UserRole.DIRECTOR,
    UserRole.ADMIN,
  ),
  validate(createDelegationSchema),
  delegationController.createDelegation,
);

// Cancel a delegation (delegator, delegate, or admin)
router.delete(
  "/:id",
  validate(cancelDelegationSchema),
  delegationController.cancelDelegation,
);

// Admin only routes
router.get(
  "/all",
  restrictTo(UserRole.ADMIN),
  delegationController.getAllDelegations,
);
router.post(
  "/expire",
  restrictTo(UserRole.ADMIN),
  delegationController.expireDelegations,
);

export default router;
