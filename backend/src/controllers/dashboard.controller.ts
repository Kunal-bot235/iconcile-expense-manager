import type { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";

export async function getMonthlySummary(req: Request, res: Response) {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      res.status(400).json({ success: false, error: "Month must be between 1 and 12" });
      return;
    }
    if (year !== undefined && (isNaN(year) || year < 2000)) {
      res.status(400).json({ success: false, error: "Invalid year" });
      return;
    }

    const summary = await dashboardService.getMonthlySummary(month, year);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
    res.status(500).json({ success: false, error: "Failed to fetch monthly summary" });
  }
}

export async function getTopVendors(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const vendors = await dashboardService.getTopVendors(limit);
    res.json({ success: true, data: vendors });
  } catch (err) {
    console.error("Error fetching top vendors:", err);
    res.status(500).json({ success: false, error: "Failed to fetch top vendors" });
  }
}

export async function getAnomalies(_req: Request, res: Response) {
  try {
    const anomalies = await dashboardService.getAnomalies();
    res.json({ success: true, data: anomalies });
  } catch (err) {
    console.error("Error fetching anomalies:", err);
    res.status(500).json({ success: false, error: "Failed to fetch anomalies" });
  }
}
