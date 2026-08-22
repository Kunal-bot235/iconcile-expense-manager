"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExpense, previewCategory } from "../../lib/api";

export default function AddExpensePage() {
  const router = useRouter();
  const [date, setDate] = useState("2026-08-22");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Debounced category preview when vendor changes
  useEffect(() => {
    const trimmed = vendor.trim();
    if (!trimmed) {
      setPredictedCategory(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingCategory(true);
        const res = await previewCategory(trimmed);
        if (res.success) {
          setPredictedCategory(res.data.category);
        }
      } catch (err) {
        console.error("Preview category error:", err);
      } finally {
        setLoadingCategory(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [vendor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!vendor.trim()) {
      setError("Vendor name is required");
      return;
    }

    if (!date) {
      setError("Date is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createExpense({
        date,
        amount: parsedAmount,
        vendor: vendor.trim(),
        description: description.trim() || undefined,
      });

      if (res.success) {
        const createdCat = res.data.category.name;
        const isAnomaly = res.data.isAnomaly;
        setSuccessMsg(
          `Expense created successfully! Auto-categorized as "${createdCat}"${
            isAnomaly ? " ⚠️ Flagged as Anomaly (>3x category avg)" : ""
          }.`
        );
        // Reset form
        setAmount("");
        setVendor("");
        setDescription("");
        setPredictedCategory(null);

        setTimeout(() => {
          router.push("/expenses");
        }, 1500);
      } else {
        setError(res.error || "Failed to create expense");
      }
    } catch (err) {
      console.error("Error creating expense:", err);
      setError("Network error. Could not save expense.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">Add Expense</h1>
        <p className="page-subtitle">
          Category is automatically assigned based on vendor rules
        </p>
      </div>

      {successMsg && <div className="result-box success" style={{ marginBottom: 20 }}>{successMsg}</div>}
      {error && <div className="result-box error" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="date">
                Date *
              </label>
              <input
                id="date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount (₹) *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 450"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vendor">
              Vendor Name *
            </label>
            <input
              id="vendor"
              type="text"
              placeholder="e.g. Swiggy, Uber, Amazon, Local Shop"
              className="form-input"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
            />
            {/* Auto-category prediction preview */}
            <div style={{ marginTop: 8 }}>
              {loadingCategory ? (
                <span className="form-hint">Matching rule...</span>
              ) : predictedCategory ? (
                <div className="category-preview">
                  <span>🏷️ Auto Category:</span>
                  <span>{predictedCategory}</span>
                </div>
              ) : vendor.trim() ? (
                <span className="form-hint">No rule match found. Will assign: Miscellaneous</span>
              ) : (
                <span className="form-hint">
                  Enter vendor name to see rule-based category preview.
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Team lunch, Office supplies"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {submitting ? "Saving Expense..." : "Save Expense"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/expenses")}
              className="btn"
              style={{ border: "1px solid var(--card-border)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
