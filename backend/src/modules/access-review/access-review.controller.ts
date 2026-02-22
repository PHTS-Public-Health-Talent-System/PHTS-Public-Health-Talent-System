/**
 * PHTS System - Access Review Controller
 *
 * Handles HTTP requests for access review operations.
 */

import { Request, Response } from "express";
import { ApiResponse } from '@/types/auth.js';
import * as accessReviewService from '@/modules/access-review/services/access-review.service.js';
import { ReviewResult } from '@/modules/access-review/services/access-review.service.js';

function mapCycleResponse(cycle: any): any {
  return {
    ...cycle,
    source: cycle.sync_source ?? "SYNC",
    cycle_code: cycle.cycle_code ?? `SYNC-${cycle.cycle_id}`,
    opened_at: cycle.opened_at ?? cycle.start_date,
    expires_at: cycle.expires_at ?? cycle.due_date,
    is_open: cycle.status !== "COMPLETED",
  };
}

/**
 * Get all review cycles
 * GET /api/access-review/cycles
 */
export async function getCycles(
  req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const year = req.query.year
      ? Number.parseInt(req.query.year as string, 10)
      : undefined;
    const cycles = await accessReviewService.getReviewCycles(year);
    res.json({ success: true, data: cycles.map((cycle) => mapCycleResponse(cycle)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get a specific review cycle
 * GET /api/access-review/cycles/:id
 */
export async function getCycle(
  req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const cycleId = Number.parseInt(req.params.id, 10);
    const cycle = await accessReviewService.getReviewCycle(cycleId);

    if (!cycle) {
      res.status(404).json({ success: false, error: "Review cycle not found" });
      return;
    }

    res.json({ success: true, data: mapCycleResponse(cycle) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Create a review cycle from latest sync context
 * POST /api/access-review/cycles
 */
export async function createCycle(
  _req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const cycle = await accessReviewService.createReviewCycle();
    res.status(201).json({ success: true, data: mapCycleResponse(cycle) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get review items for a cycle
 * GET /api/access-review/cycles/:id/items
 */
export async function getItems(
  req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const cycleId = Number.parseInt(req.params.id, 10);
    const result = req.query.result as ReviewResult | undefined;

    const items = await accessReviewService.getReviewItems(cycleId, result);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Update review result for a user
 * PUT /api/access-review/items/:id
 */
export async function updateItem(
  req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const itemId = Number.parseInt(req.params.id, 10);
    const { result, note } = req.body;
    const reviewerId = req.user!.userId;

    if (!result || !Object.values(ReviewResult).includes(result)) {
      res.status(400).json({ success: false, error: "Invalid review result" });
      return;
    }

    await accessReviewService.updateReviewItem(
      itemId,
      result,
      reviewerId,
      note,
    );
    res.json({ success: true, message: "Review item updated" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * Complete a review cycle
 * POST /api/access-review/cycles/:id/complete
 */
export async function completeCycle(
  req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const cycleId = Number.parseInt(req.params.id, 10);
    const completedBy = req.user!.userId;
    const { autoKeepPending, note } = (req.body ?? {}) as {
      autoKeepPending?: boolean;
      note?: string;
    };

    await accessReviewService.completeReviewCycle(cycleId, completedBy, {
      autoKeepPending: Boolean(autoKeepPending),
      note,
    });
    res.json({ success: true, message: "Review cycle completed" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * Auto-review pending items by sync-derived rules
 * POST /api/access-review/cycles/:id/auto-review
 */
export async function autoReviewCycle(
  req: Request,
  res: Response<ApiResponse>,
): Promise<void> {
  try {
    const cycleId = Number.parseInt(req.params.id, 10);
    const reviewerId = req.user!.userId;
    const { disableInactive } = (req.body ?? {}) as {
      disableInactive?: boolean;
    };
    const result = await accessReviewService.autoReviewCycle(cycleId, reviewerId, {
      disableInactive: disableInactive ?? true,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}
