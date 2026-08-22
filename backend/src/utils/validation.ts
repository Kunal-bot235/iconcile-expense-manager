export interface ExpenseInput {
  date: string;
  amount: number | string;
  vendor: string;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: {
    date: Date;
    amount: number;
    vendor: string;
    description: string;
  };
}

/** Validate a single expense input and return parsed data or errors. */
export function validateExpenseInput(input: Partial<ExpenseInput>): ValidationResult {
  const errors: string[] = [];

  // Vendor
  const vendor = typeof input.vendor === "string" ? input.vendor.trim() : "";
  if (!vendor) {
    errors.push("Vendor is required");
  }

  // Amount
  const amount = typeof input.amount === "string" ? parseFloat(input.amount) : input.amount;
  if (amount === undefined || amount === null || isNaN(amount as number)) {
    errors.push("Amount must be a valid number");
  } else if ((amount as number) <= 0) {
    errors.push("Amount must be greater than 0");
  }

  // Date
  let parsedDate: Date | null = null;
  if (!input.date || typeof input.date !== "string" || input.date.trim() === "") {
    errors.push("Date is required");
  } else {
    parsedDate = parseFlexibleDate(input.date.trim());
    if (!parsedDate) {
      errors.push("Date is invalid. Use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY format");
    }
  }

  // Description (optional)
  const description = typeof input.description === "string" ? input.description.trim() : "";

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      date: parsedDate!,
      amount: amount as number,
      vendor,
      description,
    },
  };
}

/**
 * Parse date strings in multiple formats:
 * - YYYY-MM-DD
 * - DD/MM/YYYY or DD-MM-YYYY
 * - MM/DD/YYYY or MM-DD-YYYY
 * Returns null if invalid.
 */
function parseFlexibleDate(dateStr: string): Date | null {
  // Try ISO format first: YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (isValidDate(d)) return d;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    // Assume DD/MM/YYYY (common in India)
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]);
    const year = parseInt(slashMatch[3]);
    const d = new Date(year, month - 1, day);
    if (isValidDate(d)) return d;
  }

  return null;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}
