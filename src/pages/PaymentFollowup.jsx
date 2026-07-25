import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import {
  Phone, MessageSquare, CheckCircle, Ghost, X, Send,
  AlertCircle, Clock, ChevronRight, Loader2, RefreshCw,
} from "lucide-react";

const COLUMNS = [
  {
    key: "NOT_CONTACTED",
    label: "Not Contacted",
    icon: Phone,
    color: "text-slate-600 dark:text-slate-300",
    headerBg: "bg-slate-100 dark:bg-slate-700/60",
    cardBorder: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  },
  {
    key: "CONTACTED",
    label: "Contacted",
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    headerBg: "bg-blue-50 dark:bg-blue-900/30",
    cardBorder: "border-blue-200 dark:border-blue-700",
    dot: "bg-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    key: "PROMISED_TO_PAY",
    label: "Promised to Pay",
    icon: CheckCircle,
    color: "text-amber-600 dark:text-amber-400",
    headerBg: "bg-amber-50 dark:bg-amber-900/30",
    cardBorder: "border-amber-200 dark:border-amber-700",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    key: "GHOSTING",
    label: "Ghosting",
    icon: Ghost,
    color: "text-rose-600 dark:text-rose-400",
    headerBg: "bg-rose-50 dark:bg-rose-900/30",
    cardBorder: "border-rose-200 dark:border-rose-700",
    dot: "bg-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

function overdueBadge(days) {
  if (days === 0) return { text: "Due today", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  if (days < 0) return { text: `Due in ${Math.abs(days)}d`, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
  if (days <= 7)  return { text: `${days}d overdue`, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  if (days <= 30) return { text: `${days}d overdue`, cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
  return { text: `${days}d overdue`, cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" };
}

function InvoiceCard({ item, col, onClick }) {
  const { fmt } = useOrg();
  const badge = overdueBadge(item.daysOverdue);
  return (
    <button
      onClick={() => onClick(item)}
      className={`w-full text-left bg-white dark:bg-slate-800 rounded-xl border ${col.cardBorder} p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug truncate flex-1">
          {item.clientName}
        </p>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5 group-hover:text-slate-400 transition" />
      </div>
      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-2">{item.invoiceNumber}</p>
      <p className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{fmt(item.balanceDue)}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.text}
        </span>
        {item.noteCount > 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {item.noteCount}
          </span>
        )}
      </div>
      {item.lastNote && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 leading-snug line-clamp-2 italic">
          "{item.lastNote}"
        </p>
      )}
    </button>
  );
}

function CardModal({ item, onClose, onStatusChange, onNoteAdded }) {
  const { fmt } = useOrg();
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [movingTo, setMovingTo] = useState(null);

  const badge = overdueBadge(item.daysOverdue);
  const currentCol = COLUMNS.find(c => c.key === item.status);

  useEffect(() => {
    api.get(`/api/payment-followup/${item.invoiceId}/notes`)
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]))
      .finally(() => setNotesLoading(false));
  }, [item.invoiceId]);

  const handleMove = async (newStatus) => {
    setMovingTo(newStatus);
    try {
      await api.put(`/api/payment-followup/${item.invoiceId}/status`, { status: newStatus });
      onStatusChange(item.invoiceId, newStatus);
    } finally {
      setMovingTo(null);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/payment-followup/${item.invoiceId}/note`, { text: noteText.trim() });
      setNotes(prev => [res.data, ...prev]);
      setNoteText("");
      onNoteAdded(item.invoiceId, res.data.text, notes.length + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-base truncate">{item.clientName}</p>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{item.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Amount + overdue */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Balance due</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{fmt(item.balanceDue)}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          {/* Current status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentCol?.dot}`} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{currentCol?.label}</span>
            {item.lastContactDate && (
              <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last contact: {item.lastContactDate}
              </span>
            )}
          </div>

          {/* Move to */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Move to</p>
            <div className="grid grid-cols-2 gap-2">
              {COLUMNS.filter(c => c.key !== item.status).map(col => {
                const Icon = col.icon;
                return (
                  <button
                    key={col.key}
                    onClick={() => handleMove(col.key)}
                    disabled={movingTo !== null}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${col.cardBorder} ${col.headerBg} ${col.color} text-xs font-medium hover:brightness-95 transition disabled:opacity-50`}
                  >
                    {movingTo === col.key
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Icon className="w-3.5 h-3.5" />}
                    {col.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add note */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Add note</p>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Called, left voicemail…"
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
              <button
                type="submit"
                disabled={!noteText.trim() || submitting}
                className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white transition shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Notes history */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">History</p>
            {notesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No notes yet — add one above.</p>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div key={note.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{note.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{fmtTime(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFollowup() {
  const { fmt } = useOrg();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/payment-followup/board");
      setItems(res.data);
    } catch {
      setError("Could not load follow-up board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (invoiceId, newStatus) => {
    setItems(prev => prev.map(i => i.invoiceId === invoiceId ? { ...i, status: newStatus } : i));
    if (selectedItem?.invoiceId === invoiceId) {
      setSelectedItem(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleNoteAdded = (invoiceId, lastNote, noteCount) => {
    setItems(prev => prev.map(i => i.invoiceId === invoiceId ? { ...i, lastNote, noteCount } : i));
    if (selectedItem?.invoiceId === invoiceId) {
      setSelectedItem(prev => ({ ...prev, lastNote, noteCount }));
    }
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = items.filter(i => i.status === col.key);
    return acc;
  }, {});

  const totalOutstanding = items.reduce((s, i) => s + Number(i.balanceDue), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        <button onClick={load} className="text-sm text-blue-600 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Follow-up Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {items.length} outstanding invoice{items.length !== 1 ? "s" : ""} · {fmt(totalOutstanding)} total
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
          <p className="text-slate-600 dark:text-slate-300 font-semibold">All invoices are paid!</p>
          <p className="text-sm text-slate-400">No outstanding invoices to follow up on.</p>
        </div>
      ) : (
        /* Kanban columns — horizontal scroll on mobile */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {COLUMNS.map(col => {
            const colItems = grouped[col.key] || [];
            const colTotal = colItems.reduce((s, i) => s + Number(i.balanceDue), 0);
            const Icon = col.icon;
            return (
              <div key={col.key} className="flex flex-col shrink-0 w-72 sm:w-auto sm:flex-1 min-w-[260px]">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 ${col.headerBg}`}>
                  <Icon className={`w-4 h-4 ${col.color} shrink-0`} />
                  <span className={`text-sm font-semibold ${col.color} flex-1 truncate`}>{col.label}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${col.badge}`}>
                    {colItems.length}
                  </span>
                </div>
                {colTotal > 0 && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 px-1">
                    {fmt(colTotal)}
                  </p>
                )}
                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {colItems.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-8 flex items-center justify-center">
                      <p className="text-xs text-slate-400 dark:text-slate-600">None here</p>
                    </div>
                  ) : (
                    colItems.map(item => (
                      <InvoiceCard
                        key={item.invoiceId}
                        item={item}
                        col={col}
                        onClick={setSelectedItem}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card modal */}
      {selectedItem && (
        <CardModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusChange={handleStatusChange}
          onNoteAdded={handleNoteAdded}
        />
      )}
    </div>
  );
}
