import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // --- 1. Seed Categories ---
  const categoryNames = [
    "Food",
    "Groceries",
    "Housing",
    "Transport",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Utilities",
    "Loan / EMI",
    "Miscellaneous",
  ];

  const categoryMap: Record<string, number> = {};

  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap[name] = cat.id;
  }
  console.log("✓ Categories seeded");

  // --- 2. Seed Vendor-to-Category Rules ---
  // Vendor names are stored normalized (lowercase, trimmed)
  const vendorRules: [string, string][] = [
    // Food
    ["zomato", "Food"],
    ["swiggy", "Food"],
    ["mcdonald's", "Food"],
    ["kfc", "Food"],
    ["dominos", "Food"],
    ["pizza hut", "Food"],
    ["starbucks", "Food"],
    // Groceries
    ["blinkit", "Groceries"],
    ["zepto", "Groceries"],
    ["bigbasket", "Groceries"],
    ["dmart", "Groceries"],
    // Transport
    ["uber", "Transport"],
    ["ola", "Transport"],
    ["rapido", "Transport"],
    // Shopping
    ["amazon", "Shopping"],
    ["flipkart", "Shopping"],
    ["myntra", "Shopping"],
    ["ajio", "Shopping"],
    // Entertainment
    ["netflix", "Entertainment"],
    ["spotify", "Entertainment"],
    ["bookmyshow", "Entertainment"],
    ["hotstar", "Entertainment"],
    // Utilities
    ["jio", "Utilities"],
    ["airtel", "Utilities"],
    // Loan / EMI
    ["bajaj finserv", "Loan / EMI"],
    ["hdfc loan", "Loan / EMI"],
  ];

  for (const [vendor, categoryName] of vendorRules) {
    const categoryId = categoryMap[categoryName];
    await prisma.vendorCategoryRule.upsert({
      where: { vendor },
      update: { categoryId },
      create: { vendor, categoryId },
    });
  }
  console.log("✓ Vendor rules seeded");

  // --- 3. Seed Expense Data ---
  // Clear existing expenses for clean demo
  await prisma.expense.deleteMany();

  // Current month expenses (August 2026) — enough data for dashboard demo
  const currentMonthExpenses = [
    // Food — several normal + 1 anomaly
    { date: "2026-08-01", amount: 450, vendor: "Zomato", description: "Lunch order" },
    { date: "2026-08-03", amount: 380, vendor: "Swiggy", description: "Dinner delivery" },
    { date: "2026-08-05", amount: 520, vendor: "Zomato", description: "Weekend brunch" },
    { date: "2026-08-08", amount: 290, vendor: "KFC", description: "Bucket meal" },
    { date: "2026-08-10", amount: 350, vendor: "Dominos", description: "Pizza night" },
    { date: "2026-08-12", amount: 410, vendor: "Swiggy", description: "Lunch" },
    { date: "2026-08-15", amount: 480, vendor: "McDonald's", description: "Family meal" },
    { date: "2026-08-18", amount: 2500, vendor: "Zomato", description: "Large party order" }, // ANOMALY

    // Groceries — normal + 1 anomaly
    { date: "2026-08-02", amount: 1200, vendor: "Blinkit", description: "Weekly groceries" },
    { date: "2026-08-06", amount: 850, vendor: "Zepto", description: "Fruits and vegetables" },
    { date: "2026-08-09", amount: 1100, vendor: "BigBasket", description: "Monthly staples" },
    { date: "2026-08-14", amount: 950, vendor: "Blinkit", description: "Household items" },
    { date: "2026-08-20", amount: 5500, vendor: "BigBasket", description: "Bulk pantry restock" }, // ANOMALY

    // Transport
    { date: "2026-08-01", amount: 250, vendor: "Uber", description: "Office commute" },
    { date: "2026-08-04", amount: 180, vendor: "Ola", description: "Airport pickup" },
    { date: "2026-08-07", amount: 320, vendor: "Uber", description: "Client meeting travel" },
    { date: "2026-08-11", amount: 150, vendor: "Rapido", description: "Quick ride" },
    { date: "2026-08-16", amount: 280, vendor: "Uber", description: "Evening commute" },

    // Shopping — normal + 1 anomaly
    { date: "2026-08-03", amount: 1500, vendor: "Amazon", description: "Phone charger + cables" },
    { date: "2026-08-07", amount: 2200, vendor: "Myntra", description: "Clothing haul" },
    { date: "2026-08-13", amount: 1800, vendor: "Flipkart", description: "Kitchen appliance" },
    { date: "2026-08-19", amount: 8500, vendor: "Amazon", description: "New monitor" }, // ANOMALY

    // Entertainment
    { date: "2026-08-01", amount: 199, vendor: "Netflix", description: "Monthly subscription" },
    { date: "2026-08-01", amount: 119, vendor: "Spotify", description: "Music subscription" },
    { date: "2026-08-10", amount: 450, vendor: "BookMyShow", description: "Movie tickets" },

    // Utilities
    { date: "2026-08-05", amount: 599, vendor: "Jio", description: "Monthly recharge" },
    { date: "2026-08-05", amount: 499, vendor: "Airtel", description: "Broadband bill" },

    // Miscellaneous (unknown vendor → fallback)
    { date: "2026-08-08", amount: 350, vendor: "Local Restaurant", description: "Team lunch" },
    { date: "2026-08-17", amount: 200, vendor: "Street Vendor", description: "Souvenirs" },
  ];

  // Previous month expenses (July 2026) — for historical data
  const previousMonthExpenses = [
    { date: "2026-07-02", amount: 400, vendor: "Zomato", description: "Lunch" },
    { date: "2026-07-05", amount: 350, vendor: "Swiggy", description: "Dinner" },
    { date: "2026-07-10", amount: 500, vendor: "Zomato", description: "Brunch" },
    { date: "2026-07-15", amount: 1100, vendor: "Blinkit", description: "Weekly groceries" },
    { date: "2026-07-18", amount: 900, vendor: "Zepto", description: "Fresh produce" },
    { date: "2026-07-08", amount: 220, vendor: "Uber", description: "Work commute" },
    { date: "2026-07-12", amount: 300, vendor: "Ola", description: "Evening ride" },
    { date: "2026-07-20", amount: 2500, vendor: "Amazon", description: "Headphones" },
    { date: "2026-07-22", amount: 1200, vendor: "Flipkart", description: "Books" },
    { date: "2026-07-01", amount: 199, vendor: "Netflix", description: "Monthly subscription" },
  ];

  const allExpenses = [...currentMonthExpenses, ...previousMonthExpenses];

  // Look up categories via vendor rules (mimics the real categorization flow)
  for (const exp of allExpenses) {
    const normalizedVendor = exp.vendor.trim().toLowerCase();

    const rule = await prisma.vendorCategoryRule.findFirst({
      where: { vendor: normalizedVendor },
    });

    const categoryId = rule
      ? rule.categoryId
      : categoryMap["Miscellaneous"];

    await prisma.expense.create({
      data: {
        date: new Date(exp.date),
        amount: exp.amount,
        vendor: exp.vendor,
        description: exp.description,
        categoryId,
        isAnomaly: false, // Will be calculated below
      },
    });
  }
  console.log("✓ Expenses seeded");

  // --- 4. Recalculate Anomalies for all categories ---
  for (const categoryName of categoryNames) {
    const categoryId = categoryMap[categoryName];
    const expenses = await prisma.expense.findMany({
      where: { categoryId },
      select: { id: true, amount: true },
    });

    if (expenses.length <= 1) continue;

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    for (const expense of expenses) {
      const amount = Number(expense.amount);
      const othersTotal = total - amount;
      const othersCount = expenses.length - 1;
      const othersAvg = othersTotal / othersCount;
      const isAnomaly = othersAvg > 0 && amount > 3 * othersAvg;

      if (isAnomaly) {
        await prisma.expense.update({
          where: { id: expense.id },
          data: { isAnomaly: true },
        });
      }
    }
  }
  console.log("✓ Anomalies calculated");

  // Summary
  const totalExpenses = await prisma.expense.count();
  const totalAnomalies = await prisma.expense.count({ where: { isAnomaly: true } });
  console.log(`\nSeed complete: ${totalExpenses} expenses, ${totalAnomalies} anomalies`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });