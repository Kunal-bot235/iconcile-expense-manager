const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string;
  amount: string;
  vendor: string;
  description: string | null;
  isAnomaly: boolean;
  createdAt: string;
  categoryId: number;
  category: Category;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface MonthlySummary {
  month: number;
  year: number;
  categories: { categoryId: number; categoryName: string; total: number }[];
  grandTotal: number;
}

export interface TopVendor {
  vendor: string;
  total: number;
}

export interface AnomalyData {
  count: number;
  expenses: Expense[];
}

export interface CsvUploadResult {
  imported: number;
  failed: number;
  expenses: Expense[];
  errors?: { row: number; errors: string[]; data: Record<string, string> }[];
}

export interface CategoryPreview {
  vendor: string;
  normalizedVendor: string;
  category: string;
  categoryId: number;
}

// --- API functions ---

async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, options);
  return res.json() as Promise<ApiResponse<T>>;
}

export async function getExpenses(): Promise<ApiResponse<Expense[]>> {
  return fetchApi<Expense[]>("/expenses");
}

export async function getExpenseById(id: number): Promise<ApiResponse<Expense>> {
  return fetchApi<Expense>(`/expenses/${id}`);
}

export async function createExpense(data: {
  date: string;
  amount: number;
  vendor: string;
  description?: string;
}): Promise<ApiResponse<Expense>> {
  return fetchApi<Expense>("/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(id: number): Promise<ApiResponse<Expense>> {
  return fetchApi<Expense>(`/expenses/${id}`, { method: "DELETE" });
}

export async function uploadCsv(file: File): Promise<ApiResponse<CsvUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi<CsvUploadResult>("/expenses/upload", {
    method: "POST",
    body: formData,
  });
}

export async function previewCategory(vendor: string): Promise<ApiResponse<CategoryPreview>> {
  return fetchApi<CategoryPreview>(
    `/expenses/preview-category?vendor=${encodeURIComponent(vendor)}`
  );
}

export async function getMonthlySummary(
  month?: number,
  year?: number
): Promise<ApiResponse<MonthlySummary>> {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const qs = params.toString();
  return fetchApi<MonthlySummary>(`/dashboard/monthly-summary${qs ? `?${qs}` : ""}`);
}

export async function getTopVendors(limit = 5): Promise<ApiResponse<TopVendor[]>> {
  return fetchApi<TopVendor[]>(`/dashboard/top-vendors?limit=${limit}`);
}

export async function getAnomalies(): Promise<ApiResponse<AnomalyData>> {
  return fetchApi<AnomalyData>("/dashboard/anomalies");
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return fetchApi<Category[]>("/categories");
}

/** Deterministic UTC date formatter (DD/MM/YYYY) to prevent SSR hydration mismatches. */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}
