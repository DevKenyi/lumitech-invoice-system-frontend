// ClientPortal.jsx — public, no auth required
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FileText, CreditCard, Download, CheckCircle, Clock, XCircle,
  AlertCircle, TrendingUp, Wallet, Landmark, Banknote, X, Loader2,
  Lock, ShieldCheck, Copy, Check,
} from "lucide-react";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8081"
    : "https://ledgerapi.lumitechsystems.com");

function ClientPortal() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payingLinkId, setPayingLinkId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  // Consolidated payment state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);
  const [consolidatedSuccess, setConsolidatedSuccess] = useState(null);

  const invoices = data?.invoices || [];
  const summary = data;

  const reload = () => {
    axios
      .get(`${baseURL}/api/public/clients/${token}/invoices`)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [token]);

  // Handle Paystack redirect-back
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference || !data) return;
    const invoice = data.invoices?.find(inv => inv.paystackReference === reference);
    if (!invoice) return;
    setVerifyingPayment(true);
    setSearchParams({}, { replace: true });
    axios
      .post(`${baseURL}/api/public/clients/${token}/invoices/${invoice.id}/verify-payment?reference=${reference}`)
      .then(() => { setPaymentSuccess(invoice.invoiceNumber); reload(); })
      .catch(e => setPaymentError(e.response?.data?.message || "Payment could not be verified. Please contact support."))
      .finally(() => setVerifyingPayment(false));
  }, [searchParams, data]);

  // Handle Flutterwave redirect-back
  useEffect(() => {
    const status = searchParams.get("status");
    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");
    const cpRef = searchParams.get("cp_ref");
    if (!txRef || !transactionId || !data) return;
    if (status !== "successful") {
      setSearchParams({}, { replace: true });
      if (status === "cancelled") setPaymentError("Payment was cancelled.");
      return;
    }
    setVerifyingPayment(true);
    setSearchParams({}, { replace: true });
    if (cpRef) {
      axios
        .post(`${baseURL}/api/public/clients/${token}/consolidated-payment/verify-flutterwave?cpRef=${cpRef}&transactionId=${transactionId}`)
        .then(res => { setConsolidatedSuccess(res.data.invoiceCount); setSelectedIds(new Set()); reload(); })
        .catch(e => setPaymentError(e.response?.data?.message || "Payment could not be verified. Please contact support."))
        .finally(() => setVerifyingPayment(false));
      return;
    }
    const invoice = data.invoices?.find(inv => inv.flutterwaveReference === txRef);
    if (!invoice) { setVerifyingPayment(false); return; }
    axios
      .post(`${baseURL}/api/public/clients/${token}/invoices/${invoice.id}/verify-flutterwave?transactionId=${transactionId}`)
      .then(() => { setPaymentSuccess(invoice.invoiceNumber); reload(); })
      .catch(e => setPaymentError(e.response?.data?.message || "Payment could not be verified. Please contact support."))
      .finally(() => setVerifyingPayment(false));
  }, [searchParams, data]);

  const downloadPdf = async (inv) => {
    try {
      setDownloadingId(inv.id);
      const res = await axios.get(
        `${baseURL}/api/public/clients/${token}/invoices/${inv.id}/pdf`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${inv.invoiceNumber}.pdf`;
      a.click();
    } catch { /* silent */ } finally {
      setDownloadingId(null);
    }
  };

  const handlePaystack = async (inv) => {
    setPayingLinkId(inv.id);
    setPaymentError(null);
    try {
      const res = await axios.post(`${baseURL}/api/public/clients/${token}/invoices/${inv.id}/payment-link`);
      window.location.href = res.data.paymentUrl;
    } catch (e) {
      setPaymentError(e.response?.data?.message || "Could not generate payment link. Please try another method.");
      setPayingLinkId(null);
    }
  };

  const handleFlutterwave = async (inv) => {
    setPayingLinkId(inv.id + "-fw");
    setPaymentError(null);
    try {
      const res = await axios.post(`${baseURL}/api/public/clients/${token}/invoices/${inv.id}/payment-link/flutterwave`);
      window.location.href = res.data.paymentUrl;
    } catch (e) {
      setPaymentError(e.response?.data?.message || "Could not generate Flutterwave link. Please try another method.");
      setPayingLinkId(null);
    }
  };

  const openPaymentOptions = (inv) => {
    setPayingInvoice(inv);
    setPaymentError(null);
    setCopiedAccount(false);
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(data?.orgBankAccountNumber || "");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const unpaidInvoices = invoices.filter(inv => inv.balanceDue > 0);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === unpaidInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaidInvoices.map(inv => inv.id)));
    }
  };

  const selectedTotal = unpaidInvoices
    .filter(inv => selectedIds.has(inv.id))
    .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const handleConsolidatedPay = async (method) => {
    if (selectedIds.size === 0) return;
    setConsolidatedLoading(true);
    setPaymentError(null);
    try {
      const res = await axios.post(
        `${baseURL}/api/public/clients/${token}/consolidated-payment-link`,
        { invoiceIds: Array.from(selectedIds), method }
      );
      window.location.href = res.data.paymentUrl;
    } catch (e) {
      setPaymentError(e.response?.data?.message || "Could not generate consolidated payment link.");
      setConsolidatedLoading(false);
    }
  };

  const portalCurrency = data?.orgCurrency || data?.invoices?.[0]?.currency || "NGN";
  const fmt = (amount, currency = portalCurrency) =>
    new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount || 0);

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status) => {
    const cfg = {
      PAID:           { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Paid" },
      PENDING:        { bg: "bg-amber-50 text-amber-700 border-amber-200",       icon: Clock,       label: "Pending" },
      OVERDUE:        { bg: "bg-rose-50 text-rose-700 border-rose-200",          icon: XCircle,     label: "Overdue" },
      PARTIALLY_PAID: { bg: "bg-blue-50 text-blue-700 border-blue-200",          icon: Clock,       label: "Partial" },
    };
    const k = status?.toUpperCase() || "PENDING";
    const { bg, icon: Icon, label } = cfg[k] || cfg.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${bg}`}>
        <Icon className="w-3 h-3" /> {label}
      </span>
    );
  };

  const canPay = (inv) =>
    inv.balanceDue > 0 &&
    (data?.orgAcceptsPaystack || data?.orgAcceptsBankTransfer || data?.orgAcceptsCash);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-4" />
          <p className="text-slate-500 text-sm">Loading your invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="p-4 bg-rose-50 rounded-full inline-block mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid or expired link</h2>
          <p className="text-slate-500 text-sm">
            This portal link is no longer valid. Please contact your service provider for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-600/20 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {summary?.clientName}
              </h1>
              <p className="text-xs text-slate-500">View &amp; pay your invoices</p>
            </div>
          </div>
        </div>
      </header>

      {/* Security trust bar */}
      {(data?.orgAcceptsPaystack || data?.orgAcceptsFlutterwave) && (
        <div className="bg-emerald-50 border-b border-emerald-100">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-700 font-medium">Secured by Paystack &amp; Flutterwave · 256-bit SSL</span>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-5 sm:py-8 space-y-4 sm:space-y-6">

        {/* Verifying payment */}
        {verifyingPayment && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <p className="text-sm font-medium text-blue-800">Verifying your payment…</p>
          </div>
        )}

        {/* Payment success banner */}
        {paymentSuccess && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                Payment for <strong>{paymentSuccess}</strong> confirmed!
              </p>
            </div>
            <button onClick={() => setPaymentSuccess(null)} className="text-emerald-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Consolidated success */}
        {consolidatedSuccess && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                <strong>{consolidatedSuccess} invoice{consolidatedSuccess > 1 ? "s" : ""}</strong> cleared!
              </p>
            </div>
            <button onClick={() => setConsolidatedSuccess(null)} className="text-emerald-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Invoiced", value: fmt(summary.totalInvoiced), color: "text-slate-900", icon: TrendingUp, grad: "from-blue-600 to-indigo-600" },
              { label: "Paid",     value: fmt(summary.totalPaid),     color: "text-emerald-600", icon: CheckCircle, grad: "from-emerald-500 to-teal-500" },
              { label: "Due",      value: fmt(summary.totalOutstanding), color: summary.totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600", icon: Wallet, grad: summary.totalOutstanding > 0 ? "from-rose-500 to-pink-500" : "from-emerald-500 to-teal-500" },
            ].map(card => (
              <div key={card.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                    <p className={`text-sm sm:text-xl font-bold mt-0.5 leading-tight break-all ${card.color}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`hidden sm:flex p-2.5 rounded-xl bg-gradient-to-br ${card.grad} shadow-sm shrink-0`}>
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Consolidated payment bar */}
        {unpaidInvoices.length >= 2 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 px-4 py-4">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600 shrink-0"
                  checked={selectedIds.size === unpaidInvoices.length && unpaidInvoices.length > 0}
                  onChange={toggleSelectAll}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedIds.size === 0
                      ? "Pay multiple invoices at once"
                      : `${selectedIds.size} selected — ${fmt(selectedTotal)}`}
                  </p>
                  {selectedIds.size === 0 && (
                    <p className="text-xs text-slate-400">Tick boxes below then pay together</p>
                  )}
                </div>
              </label>
              {selectedIds.size >= 2 && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {data?.orgAcceptsPaystack && (
                    <button
                      onClick={() => handleConsolidatedPay("paystack")}
                      disabled={consolidatedLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-60"
                    >
                      {consolidatedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Pay {fmt(selectedTotal)} · Paystack
                    </button>
                  )}
                  {data?.orgAcceptsFlutterwave && (
                    <button
                      onClick={() => handleConsolidatedPay("flutterwave")}
                      disabled={consolidatedLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-60"
                    >
                      {consolidatedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Pay {fmt(selectedTotal)} · Flutterwave
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full inline-block mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No invoices found</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-slate-100">
                {invoices.map(inv => (
                  <div key={inv.id} className={`p-4 ${selectedIds.has(inv.id) ? "bg-blue-50/50" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {inv.balanceDue > 0 && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 accent-blue-600 shrink-0 mt-0.5"
                            checked={selectedIds.has(inv.id)}
                            onChange={() => toggleSelect(inv.id)}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-mono font-semibold text-slate-900 text-sm">#{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Due {fmtDate(inv.dueDate)}</p>
                        </div>
                      </div>
                      {getStatusBadge(inv.status)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Balance due</p>
                        <p className={`text-base font-bold ${inv.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {fmt(inv.balanceDue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canPay(inv) && (
                          <button
                            onClick={() => openPaymentOptions(inv)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm active:scale-95 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => downloadPdf(inv)}
                          disabled={downloadingId === inv.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 active:scale-95 transition disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === inv.id ? "…" : "PDF"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-4 w-8" />
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance Due</th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(inv => (
                      <tr key={inv.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(inv.id) ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-4">
                          {inv.balanceDue > 0 && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                              checked={selectedIds.has(inv.id)}
                              onChange={() => toggleSelect(inv.id)}
                            />
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono font-medium text-slate-900">#{inv.invoiceNumber}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">{fmtDate(inv.issueDate)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">{fmtDate(inv.dueDate)}</td>
                        <td className="px-5 py-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                        <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-900">{fmt(inv.total)}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`font-semibold ${inv.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {fmt(inv.balanceDue)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canPay(inv) && (
                              <button
                                onClick={() => openPaymentOptions(inv)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => downloadPdf(inv)}
                              disabled={downloadingId === inv.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {downloadingId === inv.id ? "…" : "PDF"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Payment Options Modal (bottom-sheet on mobile, centered on desktop) ── */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92vh]">

            {/* Drag handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Modal header */}
            <div className="flex items-start justify-between px-5 pt-3 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pay Invoice #{payingInvoice.invoiceNumber}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Amount due:{" "}
                  <span className="font-bold text-rose-600">{fmt(payingInvoice.balanceDue)}</span>
                </p>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition shrink-0 -mr-1"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">

              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Paystack */}
              {data?.orgAcceptsPaystack && (
                <button
                  onClick={() => handlePaystack(payingInvoice)}
                  disabled={payingLinkId === payingInvoice.id}
                  className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm shrink-0">
                    {payingLinkId === payingInvoice.id
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <CreditCard className="w-5 h-5 text-white" />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-slate-900">Pay with Paystack</p>
                    <p className="text-xs text-slate-500 mt-0.5">Card, bank transfer, USSD, or QR code</p>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </button>
              )}

              {/* Flutterwave */}
              {data?.orgAcceptsFlutterwave && (
                <button
                  onClick={() => handleFlutterwave(payingInvoice)}
                  disabled={payingLinkId === payingInvoice.id + "-fw"}
                  className="w-full flex items-center gap-4 p-4 border-2 border-orange-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-sm shrink-0">
                    {payingLinkId === payingInvoice.id + "-fw"
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <CreditCard className="w-5 h-5 text-white" />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-slate-900">Pay with Flutterwave</p>
                    <p className="text-xs text-slate-500 mt-0.5">Card, bank transfer, mobile money &amp; more</p>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </button>
              )}

              {/* Bank Transfer */}
              {data?.orgAcceptsBankTransfer && data?.orgBankAccountNumber && (
                <div className="p-4 border-2 border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shrink-0">
                      <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Bank Transfer</p>
                      <p className="text-xs text-slate-500">Transfer to the account below</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 space-y-3 text-sm">
                    {data.orgBankName && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Bank</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[60%]">{data.orgBankName}</span>
                      </div>
                    )}
                    {/* Account Number with copy */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Account No.</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-lg tracking-wider">
                          {data.orgBankAccountNumber}
                        </span>
                        <button
                          onClick={copyAccountNumber}
                          className={`p-1.5 rounded-lg transition ${copiedAccount ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
                          title="Copy account number"
                        >
                          {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {data.orgBankAccountName && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Account Name</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[60%]">{data.orgBankAccountName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-500 text-xs font-medium">Amount</span>
                      <span className="font-bold text-rose-600 text-base">{fmt(payingInvoice.balanceDue)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    After transfer, send your payment receipt to your service provider for confirmation.
                  </p>
                </div>
              )}

              {/* Cash */}
              {data?.orgAcceptsCash && (
                <div className="p-4 border-2 border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm shrink-0">
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Cash Payment</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Contact your service provider to arrange a cash payment of{" "}
                      <strong>{fmt(payingInvoice.balanceDue)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Trust section */}
              {(data?.orgAcceptsPaystack || data?.orgAcceptsFlutterwave) && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs font-semibold text-emerald-700">Your payment is safe and secure</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { icon: Lock,        label: "256-bit SSL" },
                      { icon: ShieldCheck, label: "Card details never stored" },
                      { icon: CheckCircle, label: "PCI-DSS compliant" },
                    ].map(b => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-500 font-medium"
                      >
                        <b.icon className="w-3 h-3 text-emerald-500" />
                        {b.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-3 leading-relaxed">
                    Payments processed by Paystack and Flutterwave — licensed, regulated gateways. Your card details go directly to them and are never seen or stored by us.
                  </p>
                </div>
              )}

              {/* Bottom safe-area padding for phones */}
              <div className="h-4 sm:hidden" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientPortal;
