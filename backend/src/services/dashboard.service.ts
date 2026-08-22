import { prisma } from "../lib/prisma.js";

/**
 * Get monthly expense totals grouped by category.
 * Accepts optional month (1-12) and year. Defaults to current month/year.
 */
export async function getMonthlySummary(month?: number, year?: number) {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 1); // First day of next month

  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: { category: true },
  });

  // Group by category
  const categoryTotals: Record<string, { categoryId: number; categoryName: string; total: number }> =
    {};

  for (const expense of expenses) {
    const key = expense.category.name;
    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        categoryId: expense.category.id,
        categoryName: key,
        total: 0,
      };
    }
    categoryTotals[key].total += Number(expense.amount);
  }

  return {
    month: m,
    year: y,
    categories: Object.values(categoryTotals).sort((a, b) => b.total - a.total),
    grandTotal: Object.values(categoryTotals).reduce((sum, c) => sum + c.total, 0),
  };
}

/**
 * Get top N vendors by total spend across all time.
 */
export async function getTopVendors(limit: number = 5) {
  const expenses = await prisma.expense.findMany({
    select: { vendor: true, amount: true },
  });

  const vendorTotals: Record<string, number> = {};
  for (const e of expenses) {
    const vendor = e.vendor;
    vendorTotals[vendor] = (vendorTotals[vendor] || 0) + Number(e.amount);
  }

  return Object.entries(vendorTotals)
    .map(([vendor, total]) => ({ vendor, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Get all anomalous expenses with category info.
 */
export async function getAnomalies() {
  const anomalies = await prisma.expense.findMany({
    where: { isAnomaly: true },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return {
    count: anomalies.length,
    expenses: anomalies,
  };
}
