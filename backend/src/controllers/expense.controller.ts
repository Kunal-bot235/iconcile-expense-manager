import type { Request, Response } from "express";
import { validateExpenseInput } from "../utils/validation.js";
import * as expenseService from "../services/expense.service.js";
import { parseAndValidateCsv } from "../services/csv.service.js";
import { categorizeVendor, normalizeVendor } from "../services/categorization.service.js";
import { prisma } from "../lib/prisma.js";

export async function createExpense(req: Request, res: Response) {
  try {
    const result = validateExpenseInput(req.body);
    if (!result.valid || !result.parsed) {
      res.status(400).json({ success: false, error: result.errors.join("; ") });
      return;
    }

    const expense = await expenseService.createExpense(result.parsed);
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ success: false, error: "Failed to create expense" });
  }
}

export async function getExpenses(_req: Request, res: Response) {
  try {
    const expenses = await expenseService.getExpenses();
    res.json({ success: true, data: expenses });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ success: false, error: "Failed to fetch expenses" });
  }
}

export async function getExpenseById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "Invalid expense ID" });
      return;
    }

    const expense = await expenseService.getExpenseById(id);
    if (!expense) {
      res.status(404).json({ success: false, error: "Expense not found" });
      return;
    }

    res.json({ success: true, data: expense });
  } catch (err) {
    console.error("Error fetching expense:", err);
    res.status(500).json({ success: false, error: "Failed to fetch expense" });
  }
}

export async function deleteExpense(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "Invalid expense ID" });
      return;
    }

    const expense = await expenseService.deleteExpense(id);
    if (!expense) {
      res.status(404).json({ success: false, error: "Expense not found" });
      return;
    }

    res.json({ success: true, data: expense });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ success: false, error: "Failed to delete expense" });
  }
}

export async function uploadCsv(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    // Validate file type
    if (!file.originalname.endsWith(".csv") && file.mimetype !== "text/csv") {
      res.status(400).json({ success: false, error: "Only CSV files are accepted" });
      return;
    }

    const parseResult = parseAndValidateCsv(file.buffer);

    if (parseResult.valid.length === 0) {
      res.status(400).json({
        success: false,
        error: "No valid expenses found in CSV",
        details: {
          totalRows: parseResult.valid.length + parseResult.errors.length,
          validRows: 0,
          failedRows: parseResult.errors.length,
          errors: parseResult.errors,
        },
      });
      return;
    }

    const created = await expenseService.createExpenses(parseResult.valid);

    res.status(201).json({
      success: true,
      data: {
        imported: created.length,
        failed: parseResult.errors.length,
        expenses: created,
        errors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
      },
    });
  } catch (err) {
    console.error("Error uploading CSV:", err);
    res.status(500).json({ success: false, error: "Failed to process CSV upload" });
  }
}

/** Preview the auto-assigned category for a vendor name. */
export async function previewCategory(req: Request, res: Response) {
  try {
    const vendor = req.query.vendor as string;
    if (!vendor || vendor.trim() === "") {
      res.status(400).json({ success: false, error: "Vendor query parameter is required" });
      return;
    }

    const categoryId = await categorizeVendor(vendor);
    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    res.json({
      success: true,
      data: {
        vendor: vendor.trim(),
        normalizedVendor: normalizeVendor(vendor),
        category: category?.name ?? "Miscellaneous",
        categoryId,
      },
    });
  } catch (err) {
    console.error("Error previewing category:", err);
    res.status(500).json({ success: false, error: "Failed to preview category" });
  }
}
