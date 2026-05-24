import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Building2, Mail, Phone, Globe, FileText, Users,
  CheckCircle, Clock, ChevronDown, Loader2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8081" : "https://ledgerapi.lumitechsystems.com");

const STATUSES = [
  { value: "CALLED",           label: "✅ Called — spoke to them" },
  { value: "INTERESTED",       label: "🔥 Interested — wants to upgrade" },
  { value: "NOT_INTERESTED",   label: "❌ Not Interested" },
  { value: "NO_ANSWER",        label: "📵 No Answer" },
  { value: "CONVERTED",        label: "🎉 Converted — paid subscriber!" },
  { value: "FOLLOW_UP_LATER",  label: "⏰ Follow Up Later" },
];

const PLAN_LABEL = {
  FREE: "Free Trial", STARTER: "Essential", GROWTH: "Business",
  PRO: "Pro", ACCOUNTANT_PRO: "Accountant Pro",
};
const PLAN_COLOR = {
  FREE: "bg-slate-100 text-slate-600", STARTER: "bg-blue-100 text-blue-700",
  GROWTH: "bg-emerald-100 text-emerald-700", PRO: "bg-indigo-100 text-indigo-700",
  ACCOUNTANT_PRO: "bg-purple-100 text-purple-700",
};
const COUNTRY_FLAG = { NG: "🇳🇬", GH: "🇬🇭", ZA: "🇿🇦", US: "🇺🇸", GB: "🇬🇧" };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const statusLabel = (s) => STATUSES.find(x => x.value === s)?.label ?? s;

export default function FollowupPage() {
  const { token } = useParams();
  const [org, setOrg]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const [form, setForm]     = useState({ status: "", comment: "", followedBy: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchOrg = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/public/followup/${token}`);
      setOrg(res.data);
    } catch {
      setError("This follow-up link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrg(); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.status) { setFormError("Please select an outcome status."); return; }
    if (!form.followedBy.trim()) { setFormError("Please enter your name."); return; }
    setFormError(null);
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/public/followup/${token}`, form);
      setSaved(true);
      setForm({ status: "", comment: "", followedBy: "" });
      fetchOrg();
    } catch {
      setFormError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-center px-4">
      <div className="text-5xl">🔗</div>
      <h1 className="text-xl font-bold text-slate-800">Link Not Found</h1>
      <p className="text-slate-500 max-w-sm">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {org.orgName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-slate-900">{org.orgName}</h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLOR[org.plan] ?? PLAN_COLOR.FREE}`}>
                  {PLAN_LABEL[org.plan] ?? org.plan}
                </span>
                {org.suspended && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Suspended</span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                {org.orgEmail && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{org.orgEmail}</span>}
                {org.ownerPhone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{org.ownerPhone}</span>}
                {org.country && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{COUNTRY_FLAG[org.country] ?? ""} {org.country}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{org.invoiceCount}</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <FileText className="w-3 h-3" /> Invoices
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{org.clientCount}</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3 h-3" /> Clients
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">{fmtDate(org.registeredAt)}</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> Signed up
              </p>
            </div>
          </div>
        </div>

        {/* Log followup */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Log Follow-up</h2>

          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Note saved successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Outcome *</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full appearance-none px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                >
                  <option value="">Select outcome…</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Comment</label>
              <textarea
                rows={3}
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="What was discussed? Key objections? Next steps?"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your name *</label>
              <input
                type="text"
                value={form.followedBy}
                onChange={e => setForm(f => ({ ...f, followedBy: e.target.value }))}
                placeholder="e.g. Kemi"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
            </div>

            {formError && (
              <p className="text-sm text-rose-600 font-medium">{formError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-sm flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Follow-up Note"}
            </button>
          </form>
        </div>

        {/* Previous notes */}
        {org.notes?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Previous Follow-ups ({org.notes.length})</h2>
            <div className="space-y-3">
              {org.notes.map(note => (
                <div key={note.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">{statusLabel(note.status)}</span>
                    <span className="text-xs text-slate-400">{fmtDate(note.createdAt)} · {note.followedBy}</span>
                  </div>
                  {note.comment && <p className="text-sm text-slate-600">{note.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">Powered by LumiLedger · Internal use only</p>
      </div>
    </div>
  );
}
