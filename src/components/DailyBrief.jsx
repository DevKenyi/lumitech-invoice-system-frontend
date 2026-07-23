import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, RefreshCw, X, ArrowRight, Sparkles } from "lucide-react";
import api from "../services/api";

const PRIORITY_STYLES = {
  high:   { bg: "bg-rose-50 dark:bg-rose-900/20",   border: "border-rose-200 dark:border-rose-800/50",   dot: "bg-rose-500",   text: "text-rose-700 dark:text-rose-300" },
  medium: { bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800/50",  dot: "bg-amber-500",  text: "text-amber-700 dark:text-amber-300" },
  low:    { bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-800/50",    dot: "bg-blue-500",   text: "text-blue-700 dark:text-blue-300" },
};

const TYPE_ICON = {
  overdue:   AlertTriangle,
  due_soon:  Clock,
  recurring: RefreshCw,
};

function BriefItemRow({ item, onNavigate }) {
  const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low;
  const Icon = TYPE_ICON[item.type] || Clock;

  return (
    <button
      onClick={() => onNavigate(item.link)}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] ${style.bg} ${style.border}`}
    >
      <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
      <Icon size={15} className={`shrink-0 ${style.text}`} />
      <span className={`flex-1 text-sm font-medium ${style.text}`}>{item.message}</span>
      <ArrowRight size={14} className={`shrink-0 opacity-60 ${style.text}`} />
    </button>
  );
}

export default function DailyBrief() {
  const [brief, setBrief] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/ai/brief")
      .then(res => setBrief(res.data))
      .catch(() => {});
  }, []);

  if (dismissed || !brief) return null;

  // Don't show the card if there's nothing to action
  if (brief.items.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-600/25 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 left-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-200" />
          <span className="text-blue-100 text-xs font-semibold uppercase tracking-widest">Daily Brief</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-200 hover:text-white transition-colors p-1 -mr-1 -mt-1"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <div className="relative z-10 px-5 pb-2">
        <p className="text-white font-semibold text-lg leading-snug">{brief.greeting}</p>
      </div>

      {/* Items */}
      <div className="relative z-10 px-5 pb-5 mt-3 flex flex-col gap-2">
        {brief.items.map((item, idx) => (
          <BriefItemRow key={idx} item={item} onNavigate={navigate} />
        ))}
      </div>
    </div>
  );
}
