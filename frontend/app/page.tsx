"use client";

import { useEffect, useState } from "react";
import {
  getMonthlySummary,
  getTopVendors,
  getAnomalies,
  formatDate,
  MonthlySummary,
  TopVendor,
  AnomalyData,
} from "./lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, vendorsRes, anomaliesRes] = await Promise.all([
          getMonthlySummary(8, 2026), // Defaults to Aug 2026 for seed consistency, but fallback works
          getTopVendors(5),
          getAnomalies(),
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (vendorsRes.success) setTopVendors(vendorsRes.data);
        if (anomaliesRes.success) setAnomalies(anomaliesRes.data);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Failed to load dashboard data. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <span>Loading dashboard summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of monthly spending & anomalies</p>
        </div>
        <div className="result-box error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Spending summary for August 2026
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Spend (Aug)</p>
          <h2 className="stat-value">
            ₹{(summary?.grandTotal ?? 0).toLocaleString("en-IN")}
          </h2>
        </div>
        <div className="stat-card">
          <p className="stat-label">Categories Tracked</p>
          <h2 className="stat-value">{summary?.categories.length ?? 0}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label">Anomalies Flagged</p>
          <h2 className={`stat-value ${(anomalies?.count ?? 0) > 0 ? "danger" : ""}`}>
            {anomalies?.count ?? 0}
          </h2>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Monthly Totals per Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Spend by Category</h3>
          </div>
          {summary?.categories.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No expense records found for this month.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.categories.map((cat) => (
                    <tr key={cat.categoryId}>
                      <td>
                        <span className="badge badge-category">{cat.categoryName}</span>
                      </td>
                      <td className="amount-col">
                        ₹{cat.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 5 Vendors */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top 5 Vendors by Total Spend</h3>
          </div>
          {topVendors.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No vendor data available.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th style={{ textAlign: "right" }}>Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {topVendors.map((v, i) => (
                    <tr key={v.vendor}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ marginRight: 8, color: "var(--secondary)" }}>
                          #{i + 1}
                        </span>
                        {v.vendor}
                      </td>
                      <td className="amount-col">
                        ₹{v.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Anomaly Summary Section */}
        <div className="card full-width">
          <div className="card-header">
            <h3 className="card-title">
              ⚠️ Anomaly Summary ({anomalies?.count ?? 0} Detected)
            </h3>
          </div>

          {!anomalies || anomalies.count === 0 ? (
            <div className="result-box success" style={{ marginTop: 0 }}>
              ✅ No anomalous expenses detected! All expenses are within expected ranges.
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: "var(--secondary)", marginBottom: 16 }}>
                Expenses flagged when amount &gt; 3× average of other expenses in the same category.
              </p>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.expenses.map((exp) => (
                      <tr key={exp.id} className="anomaly-row">
                        <td>{formatDate(exp.date)}</td>
                        <td style={{ fontWeight: 600 }}>{exp.vendor}</td>
                        <td>
                          <span className="badge badge-category">{exp.category.name}</span>
                        </td>
                        <td>{exp.description || "-"}</td>
                        <td className="amount-col" style={{ color: "var(--danger)" }}>
                          ₹{Number(exp.amount).toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span className="badge badge-anomaly">⚠️ &gt;3× Category Avg</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
