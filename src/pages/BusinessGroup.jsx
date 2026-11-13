import { useEffect, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import { formatCurrency } from "../utils/currencies";
import {
  GitBranch, Copy, Check, Plus, CheckCircle2, XCircle, Trash2, Clock, Loader2,
} from "lucide-react";
import Toast from "../components/Toast";

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

export default function BusinessGroup() {
  const { org } = useOrg();
  const currency = org?.baseCurrency || "NGN";

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  const [targetCode, setTargetCode] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [respondingId, setRespondingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/business-group");
      setData(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load Business Group.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.myLinkCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!targetCode.trim()) return;
    setRequesting(true);
    try {
      await api.post("/api/business-group/requests", { code: targetCode.trim() });
      setTargetCode("");
      showToast("Request sent — waiting for them to accept.");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send request.", "error");
    } finally {
      setRequesting(false);
    }
  };

  const respond = async (id, accept) => {
    setRespondingId(id);
    try {
      await api.post(`/api/business-group/requests/${id}/${accept ? "accept" : "decline"}`);
      showToast(accept ? "Accepted — they can now see your monthly summary." : "Declined.");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to respond.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm("End this business link?")) return;
    setRevokingId(id);
    try {
      await api.delete(`/api/business-group/${id}`);
      showToast("Link removed.");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove link.", "error");
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading…</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Business Group</h2>
          <p className="text-xs text-slate-400">See how businesses that share with you are doing — read-only, by mutual consent.</p>
        </div>
      </div>

      {/* My code + request form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Your Business Link Code</h3>
          <p className="text-xs text-slate-400 mb-3">Give this to another business so they can request to view your summary.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-200 tracking-wider">
              {data.myLinkCode}
            </code>
            <button onClick={copyCode}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition">
              {codeCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {codeCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {data.canRequestLinks ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Request to View Another Business</h3>
            <p className="text-xs text-slate-400 mb-3">Enter their Business Link Code. They'll need to accept before you see anything.</p>
            <form onSubmit={sendRequest} className="flex items-center gap-2">
              <input value={targetCode} onChange={e => setTargetCode(e.target.value)}
                placeholder="e.g. ALPHA1B2C3" className={inputCls} />
              <button type="submit" disabled={requesting}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 flex-shrink-0">
                <Plus size={14} />{requesting ? "Sending…" : "Request"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-200 dark:border-violet-800 p-5 flex flex-col">
            <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-1">Want to view other businesses?</h3>
            <p className="text-xs text-violet-700/80 dark:text-violet-300/70 mb-3 flex-1">
              Requesting to view another business's summary — and seeing it once they accept — is an Accountant Pro feature.
              Anyone can still share their own summary with you on any plan.
            </p>
            <a href="/settings/billing" className="text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline">
              Upgrade to Accountant Pro →
            </a>
          </div>
        )}
      </div>

      {/* Incoming requests — need my response */}
      {data.incomingRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">Pending Requests — Your Response Needed</h3>
          <div className="space-y-2">
            {data.incomingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-800/50">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-medium">{req.otherOrganisationName}</span> wants to view a read-only summary of your business.
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => respond(req.id, true)} disabled={respondingId === req.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60">
                    <CheckCircle2 size={13} />Accept
                  </button>
                  <button onClick={() => respond(req.id, false)} disabled={respondingId === req.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                    <XCircle size={13} />Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview — my summary + each business sharing with me */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Overview — This Month</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.overview.map(m => (
            <div key={m.organisationId} className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 ${m.isMe ? "border-indigo-200 dark:border-indigo-800" : "border-slate-200 dark:border-slate-700"}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.organisationName}</p>
                {m.isMe && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0">YOU</span>}
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Invoiced</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(m.invoicedThisMonth, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Outstanding</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(m.outstandingBalance, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monnify collected</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(m.monnifyCollectedThisMonth, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Moniepoint POS sales</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(m.moniepointPosSalesThisMonth, currency)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outgoing requests — waiting on them */}
      {data.outgoingRequests.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Your Pending Requests</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.outgoingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm text-slate-700 dark:text-slate-200">{req.otherOrganisationName}</p>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock size={12} />Waiting for them to accept</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Who can see me */}
      {data.iShareWith.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Businesses That Can See Your Summary</h3>
          <p className="text-xs text-slate-400 mb-3">They only see the monthly numbers above — never your invoices, staff, or payment credentials.</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.iShareWith.map(link => (
              <div key={link.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm text-slate-700 dark:text-slate-200">{link.otherOrganisationName}</p>
                <button onClick={() => revoke(link.id)} disabled={revokingId === link.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition disabled:opacity-60">
                  {revokingId === link.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
