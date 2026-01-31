import { Router } from "express";
import { protect, restrictTo } from "../../middlewares/authMiddleware.js";
import { UserRole } from "../../types/auth.js";
import { getList, getSummary } from "./license-alerts.controller.js";

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.PTS_OFFICER));

router.get("/summary", getSummary);
router.get("/list", getList);

export default router;
