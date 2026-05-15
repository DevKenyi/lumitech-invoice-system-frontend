import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  BookOpen, TrendingUp, TrendingDown, RefreshCw,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const BalanceCell = ({ value, bold = false, fmt }) => {
  const positive = (value ?? 0) >= 0;
  return (
    <span
      className={`${bold ? "font-bold" : "font-semibold"} ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {fmt(value)}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, fmt }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <span className={`p-1.5 rounded-lg ${color}`}>
        <Icon size={14} />
      </span>
    </div>
    <BalanceCell value={value} bold fmt={fmt} />
  </div>
);

export default function AccountLedger() {
  const { fmt } = useOrg();
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "error") =>
    setToast({ visible: true, message, type });

  // Load accounts on mount
  useEffect(() => {
    (async () => {
      setAccountsLoading(true);
      try {
        const res = await api.get("/api/accounting/accounts");
        setAccounts(res.data ?? []);
      } catch {
        notify("Failed to load accounts.", "error");
      } finally {
        setAccountsLoading(false);
      }
    })();
  }, []);

  const loadLedger = useCallback(async () => {
    if (!selectedAccountId) {
      notify("Please select an account first.", "error");
      return;
    }
    if (!from || !to) {
      notify("Please select both a start and end date.", "error");
      return;
    }
    setLedgerLoading(true);
    setLedger(null);
    try {
      const res = await api.get(
        `/api/accounting/ledger/${selectedAccountId}?from=${from}&to=${to}`
      );
      setLedger(res.data);
    } catch (err) {
      notify(
        err.response?.data?.message || "Failed to load ledger.",
        "error"
      );
    } finally {
      setLedgerLoading(false);
    }
  }, [selectedAccountId, from, to]);

  const selectedAccount = accounts.find(
    (a) => String(a.id) === String(selectedAccountId)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Account Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Full transaction history and running balance for any account
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Account selector */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Account
            </label>
            {accountsLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-400">
                <RefreshCw size={13} className="animate-spin" /> Loading accounts…
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setLedger(null);
                }}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                <option value="">Select an account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name} ({a.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Load button */}
          <button
            onClick={loadLedger}
            disabled={ledgerLoading || !selectedAccountId}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} className={ledgerLoading ? "animate-spin" : ""} />
            {ledgerLoading ? "Loading…" : "Load Ledger"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {ledgerLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <RefreshCw size={18} className="animate-spin" /> Loading ledger…
        </div>
      )}

      {/* Empty / no account selected */}
      {!ledgerLoading && !ledger && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <BookOpen size={40} className="opacity-20" />
          <p className="text-sm">
            {selectedAccountId
              ? 'Click "Load Ledger" to view transactions.'
              : "Select an account above to view its ledger."}
          </p>
        </div>
      )}

      {/* Ledger data */}
      {!ledgerLoading && ledger && (
        <div className="space-y-5">
          {/* Account info */}
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {ledger.accountCode} — {ledger.accountName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
              {ledger.accountType}
            </span>
            <span className="text-xs text-slate-400 ml-auto">
              {ledger.from} — {ledger.to}
            </span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Opening Balance" value={ledger.openingBalance} icon={BookOpen} color="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" fmt={fmt} />
            <StatCard label="Total Debits" value={ledger.totalDebits} icon={TrendingDown} color="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" fmt={fmt} />
            <StatCard label="Total Credits" value={ledger.totalCredits} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" fmt={fmt} />
            <StatCard label="Closing Balance" value={ledger.closingBalance} icon={BookOpen} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" fmt={fmt} />
          </div>

          {/* Ledger table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Transactions
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({(ledger.lines || []).length} entries)
                </span>
              </h3>
            </div>

            {(ledger.lines || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <BookOpen size={28} className="opacity-30" />
                <p className="text-xs">No transactions found for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Reference</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-right">Debit</th>
                      <th className="px-4 py-2.5 text-right">Credit</th>
                      <th className="px-4 py-2.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(ledger.lines || []).map((line, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
                      >
                        <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                          {line.date}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {line.reference || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {line.description || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400 font-medium">
                          {line.debit ? fmt(line.debit) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          {line.credit ? fmt(line.credit) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <BalanceCell value={line.balance} bold fmt={fmt} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer totals */}
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
                      <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Period Totals
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        {fmt(ledger.totalDebits)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(ledger.totalCredits)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <BalanceCell value={ledger.closingBalance} bold fmt={fmt} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
