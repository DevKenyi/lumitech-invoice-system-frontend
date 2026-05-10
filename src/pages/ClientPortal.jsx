// ClientPortal.jsx — public, no auth required
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FileText, CreditCard, Download, CheckCircle, Clock, XCircle,
  AlertCircle, TrendingUp, Wallet, Landmark, Banknote, X, Loader2,
  Lock, ShieldCheck,
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
  // Consolidated payment state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);
  const [consolidatedSuccess, setConsolidatedSuccess] = useState(null); // count of invoices paid

  const invoices = data?.invoices || [];
  const summary = data;

  const reload = () => {
    axios
      .get(`${baseURL}/api/public/clients/${token}/invoices`)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [token]);

  // Handle Paystack redirect-back: ?reference=xxx&trxref=xxx
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference || !data) return;

    const invoice = data.invoices?.find(inv => inv.paystackReference === reference);
    if (!invoice) return;

    setVerifyingPayment(true);
    setSearchParams({}, { replace: true });

    axios
      .post(`${baseURL}/api/public/clients/${token}/invoices/${invoice.id}/verify-payment?reference=${reference}`)
      .then(() => {
        setPaymentSuccess(invoice.invoiceNumber);
        reload();
      })
      .catch(e => {
        setPaymentError(e.response?.data?.message || "Payment could not be verified. Please contact support.");
      })
      .finally(() => setVerifyingPayment(false));
  }, [searchParams, data]);

  // Handle Flutterwave redirect-back: ?status=successful&tx_ref=xxx&transaction_id=xxx
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

    // Consolidated payment redirect-back
    if (cpRef) {
      axios
        .post(`${baseURL}/api/public/clients/${token}/consolidated-payment/verify-flutterwave?cpRef=${cpRef}&transactionId=${transactionId}`)
        .then(res => {
          setConsolidatedSuccess(res.data.invoiceCount);
          setSelectedIds(new Set());
          reload();
        })
        .catch(e => setPaymentError(e.response?.data?.message || "Payment could not be verified. Please contact support."))
        .finally(() => setVerifyingPayment(false));
      return;
    }

    // Single invoice redirect-back
    const invoice = data.invoices?.find(inv => inv.flutterwaveReference === txRef);
    if (!invoice) { setVerifyingPayment(false); return; }

    axios
      .post(`${baseURL}/api/public/clients/${token}/invoices/${invoice.id}/verify-flutterwave?transactionId=${transactionId}`)
      .then(() => {
        setPaymentSuccess(invoice.invoiceNumber);
        reload();
      })
      .catch(e => {
        setPaymentError(e.response?.data?.message || "Payment could not be verified. Please contact support.");
      })
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
    } catch {
      // silent
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePaystack = async (inv) => {
    setPayingLinkId(inv.id);
    setPaymentError(null);
    try {
      const res = await axios.post(
        `${baseURL}/api/public/clients/${token}/invoices/${inv.id}/payment-link`
      );
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
      const res = await axios.post(
        `${baseURL}/api/public/clients/${token}/invoices/${inv.id}/payment-link/flutterwave`
      );
      window.location.href = res.data.paymentUrl;
    } catch (e) {
      setPaymentError(e.response?.data?.message || "Could not generate Flutterwave link. Please try another method.");
      setPayingLinkId(null);
    }
  };

  const openPaymentOptions = (inv) => {
    setPayingInvoice(inv);
    setPaymentError(null);
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

  // Use the org's currency from the portal data (set when first invoice loads)
  const portalCurrency = data?.invoices?.[0]?.currency || "NGN";
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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg}`}>
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
          <p className="text-slate-500">Loading your invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
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
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {summary?.clientName} — <span className="text-blue-600">Invoices</span>
              </h1>
              <p className="text-xs text-slate-500">View and pay your outstanding invoices</p>
            </div>
          </div>
        </div>
      </header>

      {/* Security trust bar */}
      {(data?.orgAcceptsPaystack || data?.orgAcceptsFlutterwave) && (
        <div className="bg-emerald-50 border-b border-emerald-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 flex-wrap">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-700 font-medium">Payments secured by Paystack &amp; Flutterwave</span>
            <span className="text-emerald-300 text-xs hidden sm:inline">·</span>
            <span className="text-xs text-emerald-600 hidden sm:inline">256-bit SSL</span>
            <span className="text-emerald-300 text-xs hidden sm:inline">·</span>
            <span className="text-xs text-emerald-600 hidden sm:inline">We never store your card details</span>
            <span className="text-emerald-300 text-xs hidden sm:inline">·</span>
            <span className="text-xs text-emerald-600 hidden sm:inline">PCI-DSS compliant</span>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Paystack callback — verifying payment */}
        {verifyingPayment && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-sm font-medium text-blue-800">Verifying your payment, please wait…</p>
          </div>
        )}

        {/* Payment success banner */}
        {paymentSuccess && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                Payment for <span className="font-semibold">{paymentSuccess}</span> recorded successfully!
              </p>
            </div>
            <button onClick={() => setPaymentSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Consolidated payment success banner */}
        {consolidatedSuccess && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                <span className="font-semibold">{consolidatedSuccess} invoice{consolidatedSuccess > 1 ? "s" : ""}</span> cleared successfully!
              </p>
            </div>
            <button onClick={() => setConsolidatedSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Consolidated payment bar — shows when invoices are selected */}
        {unpaidInvoices.length >= 2 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  checked={selectedIds.size === unpaidInvoices.length && unpaidInvoices.length > 0}
                  onChange={toggleSelectAll}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedIds.size === 0
                      ? "Select invoices to pay together"
                      : `${selectedIds.size} invoice${selectedIds.size > 1 ? "s" : ""} selected — ${fmt(selectedTotal)}`}
                  </p>
                  {selectedIds.size === 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">Tick the boxes below to pay multiple invoices at once</p>
                  )}
                </div>
              </div>
              {selectedIds.size >= 2 && (
                <div className="flex gap-2 flex-wrap">
                  {data?.orgAcceptsFlutterwave && (
                    <button
                      onClick={() => handleConsolidatedPay("flutterwave")}
                      disabled={consolidatedLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-60"
                    >
                      {consolidatedLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Pay {fmt(selectedTotal)} via Flutterwave
                    </button>
                  )}
                  {data?.orgAcceptsPaystack && (
                    <button
                      onClick={() => handleConsolidatedPay("paystack")}
                      disabled={consolidatedLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-60"
                    >
                      {consolidatedLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Pay {fmt(selectedTotal)} via Paystack
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoiced</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(summary.totalInvoiced)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(summary.totalPaid)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding</p>
                  <p className={`text-2xl font-bold mt-1 ${summary.totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {fmt(summary.totalOutstanding)}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl shadow-sm ${summary.totalOutstanding > 0 ? "bg-gradient-to-br from-rose-500 to-pink-500" : "bg-gradient-to-br from-emerald-500 to-teal-500"}`}>
                  <Wallet className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-16 text-center">
              <div className="p-4 bg-slate-100 rounded-full inline-block mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-4 w-8"></th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance Due</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
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
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-slate-900">
                        #{inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{fmtDate(inv.issueDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 hidden sm:table-cell">{fmtDate(inv.dueDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 hidden md:table-cell">{fmt(inv.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${inv.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {fmt(inv.balanceDue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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
                            {downloadingId === inv.id ? "..." : "PDF"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Payment Options Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Pay Invoice #{payingInvoice.invoiceNumber}</h2>
                <p className="text-sm text-slate-500">Amount due: <span className="font-semibold text-rose-600">{fmt(payingInvoice.balanceDue)}</span></p>
              </div>
              <button onClick={() => setPayingInvoice(null)} className="p-2 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {paymentError}
                </div>
              )}

              {/* Paystack */}
              {data?.orgAcceptsPaystack && (
                <button
                  onClick={() => handlePaystack(payingInvoice)}
                  disabled={payingLinkId === payingInvoice.id}
                  className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group disabled:opacity-50"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm shrink-0">
                    {payingLinkId === payingInvoice.id
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <CreditCard className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-slate-800">Pay with Paystack</p>
                    <p className="text-xs text-slate-500">Card, bank transfer, USSD, or QR code</p>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </button>
              )}

              {/* Flutterwave */}
              {data?.orgAcceptsFlutterwave && (
                <button
                  onClick={() => handleFlutterwave(payingInvoice)}
                  disabled={payingLinkId === payingInvoice.id + "-fw"}
                  className="w-full flex items-center gap-4 p-4 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition group disabled:opacity-50"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-sm shrink-0">
                    {payingLinkId === payingInvoice.id + "-fw"
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <CreditCard className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-slate-800">Pay with Flutterwave</p>
                    <p className="text-xs text-slate-500">Card, bank transfer, mobile money & more</p>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </button>
              )}

              {/* Bank Transfer */}
              {data?.orgAcceptsBankTransfer && data?.orgBankAccountNumber && (
                <div className="p-4 border-2 border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shrink-0">
                      <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Bank Transfer</p>
                      <p className="text-xs text-slate-500">Transfer to the account below</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
                    {data.orgBankName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank</span>
                        <span className="font-semibold text-slate-800">{data.orgBankName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account No.</span>
                      <span className="font-mono font-bold text-slate-900 text-base">{data.orgBankAccountNumber}</span>
                    </div>
                    {data.orgBankAccountName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Name</span>
                        <span className="font-semibold text-slate-800">{data.orgBankAccountName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-bold text-rose-600">{fmt(payingInvoice.balanceDue)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">After transfer, please send your payment receipt to your service provider for confirmation.</p>
                </div>
              )}

              {/* Cash */}
              {data?.orgAcceptsCash && (
                <div className="p-4 border-2 border-slate-200 rounded-xl flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm shrink-0">
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Cash Payment</p>
                    <p className="text-xs text-slate-500 mt-0.5">Please contact your service provider to arrange a cash payment of <strong>{fmt(payingInvoice.balanceDue)}</strong>.</p>
                  </div>
                </div>
              )}

              {/* Trust badges */}
              {(data?.orgAcceptsPaystack || data?.orgAcceptsFlutterwave) && (
                <div className="mt-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-xs font-semibold text-emerald-700">Your payment is safe and secure</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { icon: <Lock className="w-3 h-3" />, label: "256-bit SSL encryption" },
                      { icon: <ShieldCheck className="w-3 h-3" />, label: "We never store your card details" },
                      { icon: <CheckCircle className="w-3 h-3" />, label: "PCI-DSS compliant gateway" },
                      { icon: <ShieldCheck className="w-3 h-3" />, label: "Verified by Paystack & Flutterwave" },
                    ].map(b => (
                      <span key={b.label} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-500 font-medium">
                        <span className="text-emerald-500">{b.icon}</span>
                        {b.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Payments are processed by Paystack and Flutterwave — licensed and regulated payment gateways. Your card details go directly to them and are never seen or stored by us.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientPortal;
