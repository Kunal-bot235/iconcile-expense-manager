"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getExpenses, deleteExpense, formatDate, Expense } from "../lib/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError(null);
      const res = await getExpenses();
      if (res.success) {
        setExpenses(res.data);
      } else {
        setError(res.error || "Failed to load expenses");
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Failed to communicate with API server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      setDeletingId(id);
      const res = await deleteExpense(id);
      if (res.success) {
        // Reload expenses to reflect updated anomaly calculations
        await loadExpenses();
      } else {
        alert(res.error || "Failed to delete expense");
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">All logged expenses with rule-based categories & anomaly tags</p>
        </div>
        <Link href="/expenses/new" className="btn btn-primary">
          ➕ Add Expense
        </Link>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading expenses...</span>
        </div>
      ) : error ? (
        <div className="result-box error">{error}</div>
      ) : expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <p className="empty-state-text">No expenses found.</p>
            <Link href="/expenses/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              Add Your First Expense
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total Records ({expenses.length})</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className={exp.isAnomaly ? "anomaly-row" : ""}>
                    <td>{formatDate(exp.date)}</td>
                    <td style={{ fontWeight: 600 }}>{exp.vendor}</td>
                    <td>{exp.description || "-"}</td>
                    <td>
                      <span className="badge badge-category">{exp.category.name}</span>
                    </td>
                    <td className="amount-col">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </td>
                    <td>
                      {exp.isAnomaly ? (
                        <span className="badge badge-anomaly">⚠️ Anomaly (&gt;3x Avg)</span>
                      ) : (
                        <span className="badge badge-normal">Normal</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        disabled={deletingId === exp.id}
                        className="btn btn-danger"
                      >
                        {deletingId === exp.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
