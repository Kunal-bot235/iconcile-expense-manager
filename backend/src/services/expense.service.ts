import { prisma } from "../lib/prisma.js";
import { categorizeVendor } from "./categorization.service.js";
import { checkAnomaly, recalculateAnomalies } from "./anomaly.service.js";

interface CreateExpenseInput {
  date: Date;
  amount: number;
  vendor: string;
  description: string;
}

/** Create a single expense with auto-categorization and anomaly detection. */
export async function createExpense(input: CreateExpenseInput) {
  const categoryId = await categorizeVendor(input.vendor);

  const expense = await prisma.expense.create({
    data: {
      date: input.date,
      amount: input.amount,
      vendor: input.vendor,
      description: input.description,
      categoryId,
      isAnomaly: false, // Will be set by anomaly check
    },
    include: { category: true },
  });

  // Check anomaly for the newly created expense
  const isAnomaly = await checkAnomaly(expense.id, categoryId, input.amount);

  if (isAnomaly) {
    const updated = await prisma.expense.update({
      where: { id: expense.id },
      data: { isAnomaly: true },
      include: { category: true },
    });
    return updated;
  }

  // Recalculate anomalies for the category since the new expense
  // changes the average for other expenses
  await recalculateAnomalies(categoryId);

  // Re-fetch to get the potentially updated isAnomaly status
  return prisma.expense.findUnique({
    where: { id: expense.id },
    include: { category: true },
  });
}

/** Create multiple expenses (used by CSV import). Returns created expenses. */
export async function createExpenses(inputs: CreateExpenseInput[]) {
  const results = [];

  // Group by category to batch recalculations
  const affectedCategories = new Set<number>();

  for (const input of inputs) {
    const categoryId = await categorizeVendor(input.vendor);
    affectedCategories.add(categoryId);

    const expense = await prisma.expense.create({
      data: {
        date: input.date,
        amount: input.amount,
        vendor: input.vendor,
        description: input.description,
        categoryId,
        isAnomaly: false,
      },
      include: { category: true },
    });
    results.push(expense);
  }

  // Recalculate anomalies for all affected categories
  for (const categoryId of affectedCategories) {
    await recalculateAnomalies(categoryId);
  }

  // Re-fetch all created expenses with updated anomaly status
  const ids = results.map((r) => r.id);
  return prisma.expense.findMany({
    where: { id: { in: ids } },
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

/** Get all expenses with optional filters. */
export async function getExpenses() {
  return prisma.expense.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

/** Get a single expense by ID. */
export async function getExpenseById(id: number) {
  return prisma.expense.findUnique({
    where: { id },
    include: { category: true },
  });
}

/** Delete an expense by ID and recalculate anomalies for its category. */
export async function deleteExpense(id: number) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return null;

  await prisma.expense.delete({ where: { id } });

  // Recalculate anomalies for the affected category
  await recalculateAnomalies(expense.categoryId);

  return expense;
}
