import { prisma } from "../lib/prisma.js";

/** Normalize vendor name for consistent matching: trim + lowercase. */
export function normalizeVendor(vendor: string): string {
  return vendor.trim().toLowerCase();
}

/**
 * Look up the category for a vendor using VendorCategoryRule.
 * Returns the categoryId, or the "Miscellaneous" category as fallback.
 */
export async function categorizeVendor(vendor: string): Promise<number> {
  const normalized = normalizeVendor(vendor);

  const rule = await prisma.vendorCategoryRule.findFirst({
    where: {
      vendor: normalized,
    },
  });

  if (rule) {
    return rule.categoryId;
  }

  // Fallback: find "Miscellaneous" category
  const fallback = await prisma.category.findUnique({
    where: { name: "Miscellaneous" },
  });

  if (!fallback) {
    throw new Error("Fallback category 'Miscellaneous' not found. Run seed first.");
  }

  return fallback.id;
}
