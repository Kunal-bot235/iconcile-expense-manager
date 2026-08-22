import { parse } from "csv-parse/sync";
import { validateExpenseInput } from "../utils/validation.js";

interface CsvRow {
  [key: string]: string;
}

interface ParsedExpense {
  date: Date;
  amount: number;
  vendor: string;
  description: string;
}

interface CsvRowError {
  row: number;
  errors: string[];
  data: Record<string, string>;
}

export interface CsvParseResult {
  valid: ParsedExpense[];
  errors: CsvRowError[];
}

/**
 * Parse and validate a CSV buffer.
 * Expected columns: date, amount, vendor, description (optional).
 * Returns valid parsed rows and per-row error details.
 */
export function parseAndValidateCsv(buffer: Buffer): CsvParseResult {
  let records: CsvRow[];

  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch {
    return {
      valid: [],
      errors: [{ row: 0, errors: ["Invalid CSV format. Could not parse file."], data: {} }],
    };
  }

  if (records.length === 0) {
    return {
      valid: [],
      errors: [{ row: 0, errors: ["CSV file is empty or contains only headers."], data: {} }],
    };
  }

  // Check for required columns
  const firstRow = records[0];
  const columns = Object.keys(firstRow).map((c) => c.toLowerCase());
  const requiredColumns = ["date", "amount", "vendor"];
  const missingColumns = requiredColumns.filter((c) => !columns.includes(c));

  if (missingColumns.length > 0) {
    return {
      valid: [],
      errors: [
        {
          row: 0,
          errors: [`Missing required columns: ${missingColumns.join(", ")}`],
          data: firstRow,
        },
      ],
    };
  }

  const valid: ParsedExpense[] = [];
  const errors: CsvRowError[] = [];

  // Normalize column access (case-insensitive)
  function getField(row: CsvRow, field: string): string {
    const key = Object.keys(row).find((k) => k.toLowerCase() === field);
    return key ? row[key] : "";
  }

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // +2 because row 1 is headers, data starts at row 2

    const input = {
      date: getField(row, "date"),
      amount: getField(row, "amount"),
      vendor: getField(row, "vendor"),
      description: getField(row, "description"),
    };

    const result = validateExpenseInput(input);

    if (result.valid && result.parsed) {
      valid.push(result.parsed);
    } else {
      errors.push({ row: rowNum, errors: result.errors, data: row });
    }
  }

  return { valid, errors };
}
