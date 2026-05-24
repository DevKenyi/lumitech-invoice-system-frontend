import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Building2, Mail, Phone, Globe, FileText, ChevronDown,
  ChevronUp, CheckCircle, Loader2, Search, Download, MessageSquare,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8081" : "https://ledgerapi.lumitechsystems.com");

const STATUSES = [
  { value: "CALLED",          label: "✅ Called — spoke to them" },
  { value: "INTERESTED",      label: "🔥 Interested — wants to upgrade" },
  { value: "NOT_INTERESTED",  label: "❌ Not Interested" },
  { value: "NO_ANSWER",       label: "📵 No Answer" },
  { value: "CONVERTED",       label: "🎉 Converted — paid subscriber!" },
  { value: "FOLLOW_UP_LATER", label: "⏰ Follow Up Later" },
];

const PLAN_LABEL = { FREE: "Free Trial", STARTER: "Essential", GROWTH: "Business", PRO: "Pro", ACCOUNTANT_PRO: "Accountant Pro" };
const PLAN_COLOR = {
  FREE: "bg-slate-100 text-slate-600", STARTER: "bg-blue-100 text-blue-700",
  GROWTH: "bg-emerald-100 text-emerald-700", PRO: "bg-indigo-100 text-indigo-700",
  ACCOUNTANT_PRO: "bg-purple-100 text-purple-700",
};
const STATUS_COLOR = {
  CALLED: "bg-blue-100 text-blue-700", INTERESTED: "bg-emerald-100 text-emerald-700",
  NOT_INTERESTED: "bg-slate-100 text-slate-600", NO_ANSWER: "bg-amber-100 text-amber-700",
  CONVERTED: "bg-purple-100 text-purple-700", FOLLOW_UP_LATER: "bg-orange-100 text-orange-700",
};
const COUNTRY_FLAG = { NG: "🇳🇬", GH: "🇬🇭", ZA: "🇿🇦", US: "🇺🇸", GB: "🇬🇧" };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const statusLabel = (s) => STATUSES.find(x => x.value === s)?.label ?? s;

function OrgCard({ org, boardToken, onNoteAdded }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ status: "", comment: "", followedBy: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);
  const [notes, setNotes] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const loadNotes = async () => {
    if (notes !== null) return;
    setLoadingNotes(true);
    try {
      const res = await axios.get(`${API_BASE}/api/public/followup/${org.followupToken}`);
      setNotes(res.data.notes ?? []);
    } catch { setNotes([]); }
    finally { setLoadingNotes(false); }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadNotes();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.status) { setErr("Select an outcome."); return; }
    if (!form.followedBy.trim()) { setErr("Enter your name."); return; }
    setErr(null);
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/public/followup-board/${boardToken}/${org.followupToken}`, form);
      setSaved(true);
      setForm({ status: "", comment: "", followedBy: "" });
      setNotes(null);
      loadNotes();
      onNoteAdded(org.orgId, form.status);
    } catch { setErr("Failed to save. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${expanded ? "border-blue-300 shadow-blue-100" : "border-slate-200"}`}>
      {/* Header row */}
      <button
        onClick={toggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {org.orgName?.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{org.orgName}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLOR[org.plan] ?? PLAN_COLOR.FREE}`}>
              {PLAN_LABEL[org.plan] ?? org.plan}
            </span>
            {org.suspended && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Suspended</span>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 mt-0.5">
            {org.orgEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{org.orgEmail}</span>}
            {org.ownerPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{org.ownerPhone}</span>}
            {org.country && <span>{COUNTRY_FLAG[org.country] ?? ""} {org.country}</span>}
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{org.invoiceCount} invoices</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {org.latestStatus && (
            <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[org.latestStatus] ?? "bg-slate-100 text-slate-600"}`}>
              {PLAN_LABEL[org.latestStatus] ?? org.latestStatus?.replace(/_/g, " ")}
            </span>
          )}
          {org.noteCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <MessageSquare className="w-3 h-3" /> {org.noteCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded: log note + history */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 grid sm:grid-cols-2 gap-6">
          {/* Log form */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Log Follow-up</h3>
            {saved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 mb-3 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Saved!
              </div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                >
                  <option value="">Select outcome…</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <textarea
                rows={2}
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Comment (objections, next steps…)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
              <input
                type="text"
                value={form.followedBy}
                onChange={e => setForm(f => ({ ...f, followedBy: e.target.value }))}
                placeholder="Your name *"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
              {err && <p className="text-xs text-rose-600 font-medium">{err}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-sm flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Save Note"}
              </button>
            </form>
          </div>

          {/* Notes history */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">History</h3>
            {loadingNotes ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : notes?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No notes yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {notes?.map(n => (
                  <div key={n.id} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-slate-700">{statusLabel(n.status)}</span>
                      <span className="text-[10px] text-slate-400">{fmtDate(n.createdAt)} · {n.followedBy}</span>
                    </div>
                    {n.comment && <p className="text-xs text-slate-500 leading-relaxed">{n.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FollowupBoard() {
  const { boardToken } = useParams();
  const [orgs, setOrgs]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API_BASE}/api/public/followup-board/${boardToken}`)
      .then(res => setOrgs(res.data))
      .catch(() => setError("Invalid or expired board link."))
      .finally(() => setLoading(false));
  }, [boardToken]);

  const handleNoteAdded = (orgId, status) => {
    setOrgs(prev => prev.map(o =>
      o.orgId === orgId
        ? { ...o, noteCount: (o.noteCount || 0) + 1, latestStatus: status }
        : o
    ));
  };

  const exportCsv = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/public/followup-board/${boardToken}`, {
        responseType: "json"
      });
      const rows = res.data;
      const header = "Org Name,Email,Phone,Country,Plan,Invoices,Suspended,Latest Status,Notes\n";
      const lines = rows.map(o =>
        [o.orgName, o.orgEmail, o.ownerPhone, o.country, o.plan, o.invoiceCount,
         o.suspended ? "Yes" : "No", o.latestStatus ?? "", o.noteCount]
          .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
      const blob = new Blob([header + lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `followup-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-center px-4">
      <div className="text-5xl">🔗</div>
      <h1 className="text-xl font-bold text-slate-800">Board Not Found</h1>
      <p className="text-slate-500 max-w-sm">{error}</p>
    </div>
  );

  const filtered = (orgs ?? []).filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orgName?.toLowerCase().includes(q) || o.orgEmail?.toLowerCase().includes(q) || o.ownerPhone?.includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "no-followup" ? !o.latestStatus :
      filter === "converted" ? o.latestStatus === "CONVERTED" :
      filter === "interested" ? o.latestStatus === "INTERESTED" :
      true;
    return matchSearch && matchFilter;
  });

  const noFollowup = (orgs ?? []).filter(o => !o.latestStatus).length;
  const converted  = (orgs ?? []).filter(o => o.latestStatus === "CONVERTED").length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-600 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Follow-up Board</h1>
              <p className="text-sm text-slate-400">LumiLedger · Internal use only</p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="text-slate-600"><strong className="text-slate-900">{orgs?.length}</strong> total</span>
            <span className="text-rose-600"><strong>{noFollowup}</strong> not yet called</span>
            <span className="text-purple-600"><strong>{converted}</strong> converted</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          >
            <option value="all">All</option>
            <option value="no-followup">Not yet called</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
          </select>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Org list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">No organisations match your filter.</div>
          ) : (
            filtered.map(o => (
              <OrgCard key={o.orgId} org={o} boardToken={boardToken} onNoteAdded={handleNoteAdded} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
