import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
}

export async function getVendorRules(_req: Request, res: Response) {
  try {
    const rules = await prisma.vendorCategoryRule.findMany({
      include: { category: true },
      orderBy: { vendor: "asc" },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    console.error("Error fetching vendor rules:", err);
    res.status(500).json({ success: false, error: "Failed to fetch vendor rules" });
  }
}
