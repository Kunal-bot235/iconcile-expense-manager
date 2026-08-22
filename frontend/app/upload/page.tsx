"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadCsv, formatDate, CsvUploadResult } from "../lib/api";

export default function CsvUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CsvUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileSelect(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setErrorMsg("Please select a valid CSV file");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
    setResult(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setErrorMsg(null);
      setResult(null);

      const res = await uploadCsv(selectedFile);
      if (res.success) {
        setResult(res.data);
      } else {
        setErrorMsg(res.error || "Failed to upload CSV");
        if (res.data) {
          setResult(res.data);
        }
      }
    } catch (err) {
      console.error("CSV upload error:", err);
      setErrorMsg("Network error uploading CSV file.");
    } finally {
      setUploading(false);
    }
  }

  function downloadSampleCsv() {
    const csvContent = `date,amount,vendor,description
2026-08-21,450,Zomato,Dinner order
2026-08-21,1200,Blinkit,Weekly fruits
2026-08-21,350,Uber,Ride to office
2026-08-21,9500,Amazon,Monitor upgrade
2026-08-21,250,Unknown Cafe,Coffee break`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">CSV Batch Upload</h1>
          <p className="page-subtitle">
            Upload multiple expenses. System will auto-categorize and run anomaly detection.
          </p>
        </div>
        <button
          onClick={downloadSampleCsv}
          className="btn"
          style={{ border: "1px solid var(--card-border)", background: "#fff" }}
        >
          📥 Download Sample CSV
        </button>
      </div>

      {errorMsg && <div className="result-box error" style={{ marginBottom: 20 }}>{errorMsg}</div>}

      <div className="card" style={{ marginBottom: 28 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div
          className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="upload-zone-icon">📄</div>
          <h3 className="upload-zone-text">
            {selectedFile ? selectedFile.name : "Click or drag CSV file here"}
          </h3>
          <p className="upload-zone-hint">
            Required columns: <code>date</code>, <code>amount</code>, <code>vendor</code> (description optional)
          </p>

          {selectedFile && (
            <div className="upload-file-info" onClick={(e) => e.stopPropagation()}>
              <span>📁 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setSelectedFile(null);
                  setResult(null);
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn btn-primary"
          >
            {uploading ? "Parsing & Importing..." : "Upload & Process CSV"}
          </button>
        </div>
      </div>

      {/* Upload Results Display */}
      {result && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Import Summary</h3>
          </div>

          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <p className="stat-label">Successfully Imported</p>
              <h2 className="stat-value" style={{ color: "var(--success)" }}>
                {result.imported}
              </h2>
            </div>
            <div className="stat-card">
              <p className="stat-label">Failed / Invalid Rows</p>
              <h2 className={`stat-value ${result.failed > 0 ? "danger" : ""}`}>
                {result.failed}
              </h2>
            </div>
          </div>

          {/* Validation errors list */}
          {result.errors && result.errors.length > 0 && (
            <div className="result-box warning" style={{ marginBottom: 20 }}>
              <h4 style={{ margin: "0 0 8px 0", fontWeight: 600 }}>⚠️ Malformed Row Details:</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
                {result.errors.map((err, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    <strong>Row {err.row}:</strong> {err.errors.join(", ")}
                    {Object.keys(err.data).length > 0 && (
                      <span style={{ opacity: 0.8 }}> ({JSON.stringify(err.data)})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid Expenses Preview */}
          {result.expenses && result.expenses.length > 0 && (
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                Imported Expenses Preview ({result.expenses.length}):
              </h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Anomaly Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.expenses.map((exp) => (
                      <tr key={exp.id} className={exp.isAnomaly ? "anomaly-row" : ""}>
                        <td>{formatDate(exp.date)}</td>
                        <td style={{ fontWeight: 600 }}>{exp.vendor}</td>
                        <td>
                          <span className="badge badge-category">{exp.category.name}</span>
                        </td>
                        <td className="amount-col">
                          ₹{Number(exp.amount).toLocaleString("en-IN")}
                        </td>
                        <td>
                          {exp.isAnomaly ? (
                            <span className="badge badge-anomaly">⚠️ Anomaly</span>
                          ) : (
                            <span className="badge badge-normal">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <button
                  onClick={() => router.push("/expenses")}
                  className="btn btn-primary"
                >
                  View All Expenses
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="btn"
                  style={{ border: "1px solid var(--card-border)" }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
