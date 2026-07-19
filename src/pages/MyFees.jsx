import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import {
  Receipt, CheckCircle, Clock, AlertTriangle, Loader2,
  Building2, CreditCard, Banknote, ChevronDown, ChevronUp,
} from "lucide-react";

const fmtMoney = (val) =>
  Number(val || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

export default function MyFees() {
  const [searchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | "verifying" | "paid" | "failed"
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [flwLoading, setFlwLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/pos/my-fees");
      setData(res.data);
      setNotified(res.data.hasNotified);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load your fee details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify Flutterwave redirect
  useEffect(() => {
    const txRef = searchParams.get("tx_ref");
    const status = searchParams.get("status");
    const transactionId = searchParams.get("transaction_id");

    if (txRef && status === "successful" && transactionId) {
      setPaymentStatus("verifying");
      api.post(`/api/pos/my-fees/verify-flutterwave?transactionId=${transactionId}`)
        .then(() => { setPaymentStatus("paid"); load(); })
        .catch(() => setPaymentStatus("failed"));
    } else if (status === "cancelled") {
      setPaymentStatus("failed");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function payFlutterwave() {
    setFlwLoading(true);
    try {
      const res = await api.post("/api/pos/my-fees/flutterwave-link");
      window.location.href = res.data.paymentUrl;
    } catch (e) {
      alert(e.response?.data?.message || "Could not generate payment link. Please try again.");
      setFlwLoading(false);
    }
  }

  async function notifyUba() {
    setNotifying(true);
    try {
      await api.post("/api/pos/my-fees/notify-uba");
      setNotified(true);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send notification. Please try again.");
    } finally {
      setNotifying(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-24 px-6">
      <div className="text-center max-w-sm">
        <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
        <p className="text-slate-700 font-medium">{error}</p>
        <p className="text-slate-400 text-sm mt-2">If the problem persists, contact your LumiLedger account manager.</p>
      </div>
    </div>
  );

  const unpaidRows = data.rows.filter(r => !r.paid);
  const paidRows = data.rows.filter(r => r.paid);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Page title */}
      <div className="flex items-center gap-2 mb-2">
        <Receipt size={20} className="text-blue-600" />
        <h1 className="text-lg font-bold text-slate-800">Fee Statement</h1>
      </div>

      {/* Payment verified banner */}
      {paymentStatus === "paid" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={22} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Payment received!</p>
            <p className="text-sm text-emerald-600">Your payment has been verified and applied. Thank you.</p>
          </div>
        </div>
      )}
      {paymentStatus === "verifying" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-blue-600 shrink-0" />
          <p className="text-blue-800 font-medium">Verifying your payment…</p>
        </div>
      )}
      {paymentStatus === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-700 font-medium">Payment was not completed. You can try again below.</p>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <p className="text-sm text-slate-500 mb-1">Total Outstanding</p>
        <p className="text-3xl font-bold text-red-600">₦{fmtMoney(data.totalOutstanding)}</p>
        <p className="text-xs text-slate-400 mt-1">{unpaidRows.length} unsettled date(s)</p>
      </div>

      {/* Outstanding fees table */}
      {unpaidRows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Receipt size={16} className="text-slate-500" />
            <p className="font-semibold text-slate-700 text-sm">Outstanding Fees</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase text-slate-400">
                <th className="px-4 py-2.5 text-left">Date</th>
                <th className="px-4 py-2.5 text-center">Orders</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unpaidRows.map(r => (
                <tr key={r.date} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 font-medium">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{r.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">₦{fmtMoney(r.totalFees)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setExpandedRow(expandedRow === r.date ? null : r.date)}
                      className="text-slate-400 hover:text-blue-600 transition-colors">
                      {expandedRow === r.date ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <td className="px-4 py-3 text-slate-700">Total</td>
                <td></td>
                <td className="px-4 py-3 text-right text-red-600 text-base">₦{fmtMoney(data.totalOutstanding)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Already settled rows */}
      {paidRows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <p className="font-semibold text-slate-700 text-sm">Settled Fees</p>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {paidRows.map(r => (
                <tr key={r.date} className="opacity-60">
                  <td className="px-4 py-2.5 text-slate-600">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2.5 text-center text-slate-400">{r.orderCount}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">₦{fmtMoney(r.totalFees)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Paid</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {unpaidRows.length === 0 && paymentStatus !== "paid" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-emerald-800">You're all settled up!</p>
          <p className="text-sm text-emerald-600 mt-1">No outstanding fees at this time.</p>
        </div>
      )}

      {/* Payment options */}
      {unpaidRows.length > 0 && paymentStatus !== "paid" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
          <p className="font-semibold text-slate-800">Pay ₦{fmtMoney(data.totalOutstanding)}</p>

          {/* Flutterwave */}
          {data.acceptsFlutterwave && (
            <div>
              <button onClick={payFlutterwave} disabled={flwLoading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                {flwLoading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <CreditCard size={18} />}
                {flwLoading ? "Opening payment…" : "Pay with Flutterwave"}
              </button>
              <p className="text-xs text-slate-400 text-center mt-1">Card, bank transfer, USSD and more</p>
            </div>
          )}

          {data.acceptsFlutterwave && data.acceptsBankTransfer && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {/* UBA bank transfer */}
          {data.acceptsBankTransfer && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote size={16} className="text-slate-500" />
                  <p className="text-sm font-semibold text-slate-700">Bank Transfer</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bank</span>
                  <span className="font-medium text-slate-800">{data.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-bold text-slate-900 font-mono tracking-wider">{data.bankAccountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Account Name</span>
                  <span className="font-medium text-slate-800">{data.bankAccountName}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-red-600">₦{fmtMoney(data.totalOutstanding)}</span>
                </div>
              </div>

              {notified ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <Clock size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Awaiting Confirmation</p>
                    <p className="text-xs text-amber-600">We received your notification and will confirm shortly.</p>
                  </div>
                </div>
              ) : (
                <button onClick={notifyUba} disabled={notifying}
                  className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-60 font-semibold py-3 rounded-xl transition-colors">
                  {notifying ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                  {notifying ? "Sending…" : "I have sent the payment"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 pb-4">
        Powered by <span className="font-semibold">LumiLedger</span> &mdash; lumitechsystems.com
      </p>
    </div>
  );
}
