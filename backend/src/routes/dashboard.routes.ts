import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/monthly-summary", dashboardController.getMonthlySummary);
router.get("/top-vendors", dashboardController.getTopVendors);
router.get("/anomalies", dashboardController.getAnomalies);

export default router;
