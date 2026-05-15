import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "https://api.lumitechsystems.com";

const STATUS_BADGE = {
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CHANGES_REQUESTED: "bg-amber-100 text-amber-700",
};

export default function POResponse() {
  const { token } = useParams();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null); // "ACCEPT" | "REJECT" | "CHANGES"
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE}/api/public/po/${token}`)
      .then((r) => setPo(r.data))
      .catch((e) => {
        if (e.response?.status === 410) {
          setError("This link has expired. Please ask your supplier to resend the purchase order.");
        } else {
          setError("Purchase order not found.");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!action) return;
    if ((action === "REJECT" || action === "CHANGES") && !comment.trim()) {
      setSubmitError("Please provide a comment explaining your decision.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await axios.post(`${BASE}/api/public/po/${token}/respond`, {
        action,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitError(
        e.response?.data?.message || "Failed to submit response. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (val) =>
    val
      ? new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2 }).format(val)
      : "0.00";

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Link Unavailable</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const label =
      action === "ACCEPT"
        ? "Accepted"
        : action === "REJECT"
        ? "Rejected"
        : "Changes Requested";
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{action === "ACCEPT" ? "✅" : action === "REJECT" ? "❌" : "🔄"}</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Response Submitted</h2>
          <p className="text-slate-500 text-sm">
            You have <strong>{label}</strong> purchase order{" "}
            <strong>{po?.poNumber}</strong>. The sender has been notified.
          </p>
        </div>
      </div>
    );
  }

  // Already responded
  if (po.status !== "SENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Already Responded</h2>
          <p className="text-slate-500 text-sm">
            This purchase order has already been responded to (status:{" "}
            <strong>{po.status.replace("_", " ")}</strong>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-xl px-6 py-5">
          <h1 className="text-white text-xl font-bold">Purchase Order</h1>
          <p className="text-blue-100 text-sm mt-0.5">Review and respond below</p>
        </div>

        {/* PO Details */}
        <div className="bg-white shadow px-6 py-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">PO Number</p>
              <p className="text-lg font-semibold text-slate-800">{po.poNumber}</p>
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_BADGE[po.status] || "bg-slate-100 text-slate-600"}`}
            >
              {po.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Issue Date</p>
              <p className="text-slate-700 font-medium">{fmtDate(po.issueDate)}</p>
            </div>
            <div>
              <p className="text-slate-400">Expected Delivery</p>
              <p className="text-slate-700 font-medium">{fmtDate(po.expectedDate)}</p>
            </div>
          </div>

          {po.notes && (
            <div className="bg-slate-50 rounded p-3 text-sm text-slate-600">
              <p className="text-xs text-slate-400 mb-1">Notes</p>
              {po.notes}
            </div>
          )}

          {/* Items */}
          {po.items && po.items.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Items</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{item.description}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-slate-700">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900">{fmt(po.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Response Section */}
        <div className="bg-white shadow rounded-b-xl px-6 py-6 border-t border-slate-100 space-y-5">
          <h3 className="text-slate-800 font-semibold text-base">Your Response</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setAction("ACCEPT")}
              className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-all ${
                action === "ACCEPT"
                  ? "bg-green-600 text-white border-green-600"
                  : "border-green-300 text-green-700 hover:bg-green-50"
              }`}
            >
              ✓ Accept
            </button>
            <button
              onClick={() => setAction("REJECT")}
              className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-all ${
                action === "REJECT"
                  ? "bg-red-600 text-white border-red-600"
                  : "border-red-300 text-red-700 hover:bg-red-50"
              }`}
            >
              ✗ Reject
            </button>
            <button
              onClick={() => setAction("CHANGES")}
              className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-all ${
                action === "CHANGES"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-amber-300 text-amber-700 hover:bg-amber-50"
              }`}
            >
              ↩ Request Changes
            </button>
          </div>

          {action && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comment{action === "ACCEPT" ? " (optional)" : " (required)"}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  action === "ACCEPT"
                    ? "Add any notes for the buyer..."
                    : action === "REJECT"
                    ? "Please explain why you're rejecting this PO..."
                    : "Describe the changes you'd like to see..."
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!action || submitting}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>

          <p className="text-xs text-slate-400 text-center">
            This link was sent specifically to you and expires 48 hours after the PO was sent.
          </p>
        </div>
      </div>
    </div>
  );
}
