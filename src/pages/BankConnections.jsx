import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Building2, RefreshCw, Trash2, Plus, AlertTriangle,
  CheckCircle, Clock, ChevronRight, X, Loader2,
} from "lucide-react";

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
          <button
            onClick={openMonoConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-60"
          >
            {connecting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Connect Bank Account
          </button>
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
