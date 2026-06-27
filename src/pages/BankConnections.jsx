import { useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";
import {
  Building2, RefreshCw, Trash2, Plus, AlertTriangle,
  CheckCircle, Clock, ChevronRight, X, Loader2,
  Upload, FileText, CloudUpload, Download, XCircle, Info, Landmark,
} from "lucide-react";

const SAMPLE_CSV = `date,description,debit_account,credit_account,amount,reference
2026-01-15,Client payment received,1100,4000,5000.00,INV-001
2026-01-16,Rent payment,5200,1100,50000.00,RENT-JAN`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "sample-bank-statement.csv"; a.click();
  URL.revokeObjectURL(url);
}

function ImportStatementModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef(null);

  const acceptFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) { setSubmitError("Only .csv files are accepted."); return; }
    setFile(f); setResult(null); setSubmitError("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true); setSubmitError(""); setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/api/accounting/import", formData);
      setResult(data); setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Import failed. Please check your file and try again.");
    } finally { setLoading(false); }
  };

  const allPassed = result && result.errors?.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Import Bank Statement</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info */}
          <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 rounded-xl">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Each CSV row creates a journal entry. Use account codes from your{" "}
              <a href="/accounting/accounts" className="underline font-medium">Chart of Accounts</a>.
            </p>
          </div>

          {/* Format */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><FileText size={13} />Expected Format</span>
              <button onClick={downloadSample} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                <Download size={12} /> Download Sample
              </button>
            </div>
            <pre className="px-4 py-3 text-xs text-emerald-400 dark:text-emerald-300 font-mono overflow-x-auto bg-slate-900 dark:bg-slate-950">{SAMPLE_CSV}</pre>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all px-6 py-10 text-center ${
              dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : file ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
              : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30"
            }`}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => acceptFile(e.target.files?.[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                  className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1">
                  <X size={11} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <CloudUpload className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {dragging ? "Drop your CSV here" : "Drag & drop your CSV here"}
                </p>
                <p className="text-xs text-slate-400">or click to browse — .csv files only</p>
              </div>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{submitError}</p>
            </div>
          )}

          {result && (
            <div className={`rounded-2xl border overflow-hidden ${allPassed ? "border-emerald-200 dark:border-emerald-800" : "border-amber-200 dark:border-amber-800"}`}>
              <div className={`px-5 py-3 flex items-center gap-3 ${allPassed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                {allPassed ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                <p className={`text-sm font-semibold ${allPassed ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                  {result.imported} of {result.totalRows} rows imported successfully
                </p>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 px-5 py-4 space-y-2">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-rose-700 dark:text-rose-300">{err}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300">
              Close
            </button>
            <button onClick={handleImport} disabled={!file || loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importing…</> : <><Upload size={14} />Import</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const MONO_PUBLIC_KEY = import.meta.env.VITE_MONO_PUBLIC_KEY;

function loadMonoScript() {
  return new Promise((resolve) => {
    if (document.getElementById("mono-connect-script")) { resolve(); return; }
    const script = document.createElement("script");
    script.id = "mono-connect-script";
    script.src = "https://connect.withmono.com/connect.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function BankConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/bank/connections");
      setConnections(res.data);
    } catch {
      showToast("Failed to load bank connections", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const openMonoConnect = async () => {
    setConnecting(true);
    try {
      await loadMonoScript();
      const mono = new window.Connect({
        key: MONO_PUBLIC_KEY,
        onSuccess: async ({ code }) => {
          try {
            await api.post("/api/bank/connect", { code });
            showToast("Bank account connected successfully!");
            fetchConnections();
          } catch (err) {
            showToast(err.response?.data?.message || "Failed to connect account", "error");
          }
        },
        onClose: () => setConnecting(false),
      });
      mono.open();
    } catch {
      showToast("Failed to load Mono Connect. Please try again.", "error");
      setConnecting(false);
    }
  };

  const syncConnection = async (connection) => {
    setSyncing(connection.id);
    try {
      const res = await api.post(`/api/bank/connections/${connection.id}/sync`);
      showToast(`Synced ${res.data.imported} new transaction${res.data.imported !== 1 ? "s" : ""}`);
      fetchConnections();
      if (selectedConnection?.id === connection.id) fetchTransactions(connection);
    } catch {
      showToast("Sync failed. Please try again.", "error");
    } finally {
      setSyncing(null);
    }
  };

  const fetchTransactions = async (connection) => {
    setSelectedConnection(connection);
    setTxLoading(true);
    try {
      const res = await api.get(`/api/bank/connections/${connection.id}/transactions?size=100`);
      setTransactions(res.data.content || []);
    } catch {
      showToast("Failed to load transactions", "error");
    } finally {
      setTxLoading(false);
    }
  };

  const disconnect = async (connection) => {
    try {
      await api.delete(`/api/bank/connections/${connection.id}`);
      setConfirmDisconnect(null);
      if (selectedConnection?.id === connection.id) { setSelectedConnection(null); setTransactions([]); }
      showToast("Bank account disconnected");
      fetchConnections();
    } catch {
      showToast("Failed to disconnect account", "error");
    }
  };

  const fmt = (amount) => amount != null
    ? new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2 }).format(amount)
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bank Connections</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect your bank account to automatically import transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Upload size={16} />
              Import Statement
            </button>
            <button
              onClick={openMonoConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-60"
            >
              {connecting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Connect Bank Account
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — connections list */}
          <div className="lg:col-span-1 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : connections.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Building2 size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">No bank accounts connected</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Click "Connect Bank Account" to get started</p>
              </div>
            ) : (
              connections.map(conn => (
                <div
                  key={conn.id}
                  onClick={() => fetchTransactions(conn)}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 cursor-pointer transition-all ${selectedConnection?.id === conn.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl shrink-0">
                        <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{conn.bankName || "Bank Account"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conn.accountName}</p>
                        {conn.accountNumber && <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">****{conn.accountNumber.slice(-4)}</p>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${conn.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${conn.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {conn.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); syncConnection(conn); }}
                        disabled={syncing === conn.id}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400 hover:text-blue-600 disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw size={13} className={syncing === conn.id ? "animate-spin" : ""} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDisconnect(conn); }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition text-slate-400 hover:text-rose-600"
                        title="Disconnect"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {conn.lastSyncedAt && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                      <Clock size={11} /> Last synced {new Date(conn.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right — transactions */}
          <div className="lg:col-span-2">
            {!selectedConnection ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center h-full flex flex-col items-center justify-center">
                <Building2 size={40} className="text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm text-slate-400 dark:text-slate-500">Select a connected account to view transactions</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">{selectedConnection.bankName}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{selectedConnection.accountName}</p>
                  </div>
                  <button
                    onClick={() => syncConnection(selectedConnection)}
                    disabled={syncing === selectedConnection.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={syncing === selectedConnection.id ? "animate-spin" : ""} />
                    Sync Now
                  </button>
                </div>

                {txLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-sm text-slate-400 dark:text-slate-500">
                    No transactions found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Narration</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Debit</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Credit</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-5 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                              {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </td>
                            <td className="px-5 py-3 text-slate-700 dark:text-slate-200 max-w-xs">
                              <span className="line-clamp-2">{tx.narration || "—"}</span>
                            </td>
                            <td className="px-5 py-3 text-right whitespace-nowrap text-rose-600 dark:text-rose-400 font-medium">
                              {tx.type === "debit" ? fmt(tx.amount) : "—"}
                            </td>
                            <td className="px-5 py-3 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-medium">
                              {tx.type === "credit" ? fmt(tx.amount) : "—"}
                            </td>
                            <td className="px-5 py-3 text-right whitespace-nowrap text-slate-600 dark:text-slate-300 hidden md:table-cell">
                              {fmt(tx.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Statement modal */}
      {showImport && <ImportStatementModal onClose={() => setShowImport(false)} />}

      {/* Disconnect confirmation */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-800 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
                <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Disconnect Bank Account?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will remove <strong>{confirmDisconnect.bankName}</strong> and delete all imported transactions. This cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setConfirmDisconnect(null)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => disconnect(confirmDisconnect)} className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
