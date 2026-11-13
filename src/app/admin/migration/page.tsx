"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  Play,
  Search,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { DEFAULT_MIGRATION_ALLOWLIST, MigrationReport } from "@/lib/legacy-migration";

interface ReapplyStats {
  totalLegacyEmails: number;
  reappliedCount: number;
  notYetReappliedCount: number;
  notYetReappliedEmails: string[];
}

export default function AdminMigrationPage() {
  const [source, setSource] = useState<"app_state" | "file">("app_state");
  const [allowlistText, setAllowlistText] = useState(
    DEFAULT_MIGRATION_ALLOWLIST.join(", ")
  );
  const [fileData, setFileData] = useState<unknown>(null);
  const [fileName, setFileName] = useState<string>("");
  const [confirmToken, setConfirmToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [dryRunCompleted, setDryRunCompleted] = useState(false);

  const [reapplyStats, setReapplyStats] = useState<ReapplyStats | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResults, setLookupResults] = useState<Array<{
    source: string;
    collection: string;
    recordId: string;
    status?: string;
    raw: Record<string, unknown>;
  }> | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchReapplyStats = async () => {
    try {
      const res = await fetch("/api/admin/migrate-legacy", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { reapplyStats?: ReapplyStats };
        if (data.reapplyStats) setReapplyStats(data.reapplyStats);
      }
    } catch {
      // Ignore initial load errors if not yet signed in
    }
  };

  useEffect(() => {
    fetchReapplyStats();
  }, []);

  const parseAllowlist = (): string[] =>
    allowlistText
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDryRunCompleted(false);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setFileData(parsed);
      setFileName(file.name);
      setSource("file");
    } catch {
      setError("Invalid JSON file selected. Please upload a valid JSON export.");
      setFileData(null);
      setFileName("");
    }
  };

  const runMigrationRequest = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    try {
      if (source === "file" && !fileData) {
        setError("Please upload a legacy JSON file first.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/migrate-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          allowlist: parseAllowlist(),
          dry_run: dryRun,
          confirm_token: dryRun ? undefined : confirmToken.trim(),
          fileData: source === "file" ? fileData : undefined,
        }),
      });

      const data = (await res.json()) as MigrationReport & { error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `Migration request failed (HTTP ${res.status}).`);
        if (data.collections) setReport(data);
        if (dryRun) setDryRunCompleted(false);
      } else {
        setReport(data);
        if (dryRun) {
          setDryRunCompleted(true);
        } else {
          setConfirmToken("");
          await fetchReapplyStats();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportLocalData = () => {
    try {
      // Read-only read from localStorage — never modifies or clears storage
      const raw = window.localStorage.getItem("scds_ambassador_hub_db_v1");
      if (!raw) {
        setError("No legacy data found in this browser's localStorage.");
        return;
      }
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scds-localstorage-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not export localStorage data."
      );
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scds-migration-${report.dryRun ? "dry-run" : "executed"}-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNotReapplied = () => {
    if (!reapplyStats?.notYetReappliedEmails?.length) return;
    const csv = ["email", ...reapplyStats.notYetReappliedEmails].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scds-legacy-not-reapplied-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;
    setLookupLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/migrate-legacy?lookupEmail=${encodeURIComponent(
          lookupEmail.trim().toLowerCase()
        )}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as {
        error?: string;
        lookupMatches?: Array<{
          source: string;
          collection: string;
          recordId: string;
          status?: string;
          raw: Record<string, unknown>;
        }>;
      };
      if (!res.ok) {
        setError(data.error || "Lookup failed.");
      } else {
        setLookupResults(data.lookupMatches || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup network error.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Insert-Only Legacy Preservation &amp; Allowlist Migration
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Legacy Data Migration Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Default mode is Dry Run (zero writes). Only allowlisted emails enter live tables; all money/points data goes to <code>legacy_quarantine</code>, and everyone else is archived in <code>legacy_records</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportLocalData}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Download className="h-3.5 w-3.5" />
          Export my local data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Migration Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              1. Legacy Data Source
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSource("app_state");
                  setDryRunCompleted(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition ${
                  source === "app_state"
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                Live public.app_state
              </button>
              <label
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border cursor-pointer transition ${
                  source === "file"
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                {fileName ? `File: ${fileName}` : "Upload JSON Export"}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              2. Explicit Allowlist Emails (max 10, comma-separated)
            </label>
            <input
              type="text"
              value={allowlistText}
              onChange={(e) => {
                setAllowlistText(e.target.value);
                setDryRunCompleted(false);
              }}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-600 focus:outline-none"
              placeholder="kinyuam047@gmail.com, hnjoroge2005@gmail.com"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => runMigrationRequest(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
            >
              <Play className="h-3.5 w-3.5" />
              {loading ? "Running..." : "Dry run (0 writes)"}
            </button>

            {report && (
              <button
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <FileJson className="h-3.5 w-3.5" />
                Download JSON report
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={confirmToken}
              onChange={(e) => setConfirmToken(e.target.value)}
              placeholder='Type "MIGRATE" to unlock'
              className="w-44 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => runMigrationRequest(false)}
              disabled={loading || !dryRunCompleted || confirmToken.trim() !== "MIGRATE"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition"
              title="Complete a Dry Run first and type MIGRATE to enable"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Run migration
            </button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      {report && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2
                className={`h-4 w-4 ${
                  report.dryRun ? "text-blue-600" : "text-emerald-600"
                }`}
              />
              {report.dryRun ? "Dry Run Preview (Zero Writes)" : "Migration Executed (Insert-Only)"}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Plain-text passwords in source: {report.plaintextPasswordCount} | scrypt:{" "}
              {report.scryptPasswordCount} | Legacy-only emails: {report.legacyOnlyEmailsCount}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3">Collection</th>
                  <th className="py-2 pr-3">Would Insert Live</th>
                  <th className="py-2 pr-3">Would Archive</th>
                  <th className="py-2 pr-3">Would Skip Existing</th>
                  <th className="py-2 pr-3">Would Quarantine</th>
                  <th className="py-2 pr-3">Conflicts / Skipped</th>
                  <th className="py-2 pr-3">Inserted / Archived</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.collections).map(([name, c]) => (
                  <tr key={name} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-semibold text-slate-800">{name}</td>
                    <td className="py-2 pr-3">{c.wouldInsertLive}</td>
                    <td className="py-2 pr-3">{c.wouldArchive}</td>
                    <td className="py-2 pr-3">{c.wouldSkipExisting}</td>
                    <td className="py-2 pr-3">{c.wouldQuarantine}</td>
                    <td className="py-2 pr-3">{c.conflicts + c.wouldSkipInvalid}</td>
                    <td className="py-2 pr-3 font-semibold text-emerald-700">
                      {c.insertedLive + c.archived + c.quarantined}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {report.invalidEmails.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Invalid-looking emails (not auto-fixed):</strong>{" "}
              {report.invalidEmails.map((i) => `${i.email} (${i.reason})`).join("; ")}
            </div>
          )}

          {report.payoutReconfirmFlagged.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <strong>Payout phone flagged for re-confirmation:</strong>{" "}
              {report.payoutReconfirmFlagged.map((p) => p.email).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Reapply Stats & Read-Only Legacy Lookup */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900">
            Legacy-Only Reapply Progress
          </h2>
          {reapplyStats ? (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex gap-4">
                <div>
                  <span className="font-bold text-slate-900">
                    {reapplyStats.totalLegacyEmails}
                  </span>{" "}
                  total legacy emails
                </div>
                <div>
                  <span className="font-bold text-emerald-700">
                    {reapplyStats.reappliedCount}
                  </span>{" "}
                  reapplied
                </div>
                <div>
                  <span className="font-bold text-amber-700">
                    {reapplyStats.notYetReappliedCount}
                  </span>{" "}
                  not yet reapplied
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadNotReapplied}
                disabled={reapplyStats.notYetReappliedCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download not-reapplied emails (CSV)
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Sign in as administrator to view live reapply progress.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900">
            Read-Only Legacy Lookup by Email
          </h2>
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="Search legacy email..."
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-brand-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" />
              Lookup
            </button>
          </form>
          {lookupResults && (
            <div className="text-xs space-y-2 max-h-48 overflow-y-auto">
              {lookupResults.length === 0 ? (
                <p className="text-slate-500">No legacy record found for that email.</p>
              ) : (
                lookupResults.map((m, idx) => (
                  <div
                    key={`${m.collection}-${m.recordId}-${idx}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                  >
                    <div className="font-semibold text-slate-800">
                      {m.collection} ({m.recordId}) — status: {m.status || "n/a"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
