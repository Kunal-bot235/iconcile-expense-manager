import { prisma } from "../lib/prisma.js";

/**
 * Check if an expense amount is anomalous for its category.
 *
 * Rule: amount > 3 × (average of OTHER expenses in the same category)
 *
 * Design decisions:
 * - The expense being checked is EXCLUDED from the average to avoid self-distortion.
 * - If there are fewer than 2 other expenses in the category, we don't flag as anomaly
 *   (insufficient data to determine a meaningful average).
 */
export async function checkAnomaly(
  expenseId: number,
  categoryId: number,
  amount: number
): Promise<boolean> {
  const result = await prisma.expense.aggregate({
    _avg: { amount: true },
    _count: { id: true },
    where: {
      categoryId,
      id: { not: expenseId },
    },
  });

  const count = result._count.id;
  const avg = result._avg.amount;

  // Not enough data to determine anomaly
  if (count < 1 || avg === null) {
    return false;
  }

  const avgValue = typeof avg === "object" ? Number(avg) : Number(avg);

  // Average is 0 or negative — can't meaningfully detect anomaly
  if (avgValue <= 0) {
    return false;
  }

  return amount > 3 * avgValue;
}

/**
 * Recalculate anomaly status for all expenses in a given category.
 * Called after inserting or deleting expenses to ensure consistency.
 */
export async function recalculateAnomalies(categoryId: number): Promise<void> {
  const expenses = await prisma.expense.findMany({
    where: { categoryId },
    select: { id: true, amount: true },
  });

  if (expenses.length <= 1) {
    // With 0 or 1 expense, nothing can be anomalous
    await prisma.expense.updateMany({
      where: { categoryId },
      data: { isAnomaly: false },
    });
    return;
  }

  // Calculate total for the category
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    // Average of all OTHER expenses in this category
    const othersTotal = total - amount;
    const othersCount = expenses.length - 1;
    const othersAvg = othersTotal / othersCount;

    const isAnomaly = othersAvg > 0 && amount > 3 * othersAvg;

    await prisma.expense.update({
      where: { id: expense.id },
      data: { isAnomaly },
    });
  }
}
