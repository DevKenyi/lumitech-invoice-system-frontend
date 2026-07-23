import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, RefreshCw, X, ArrowRight, Sparkles } from "lucide-react";
import api from "../services/api";

const TYPE_ICON = {
  overdue:  AlertTriangle,
  due_soon: Clock,
  recurring: RefreshCw,
};

const DOT_COLOR = {
  high:   "bg-rose-400",
  medium: "bg-amber-400",
  low:    "bg-blue-300",
};

export default function DailyBrief() {
  const [brief, setBrief] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/ai/brief")
      .then(res => setBrief(res.data))
      .catch(() => {});
  }, []);

  if (dismissed || !brief || brief.items.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-md shadow-blue-500/20 px-4 py-3">
      {/* Greeting row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={14} className="text-blue-200 shrink-0" />
          <p className="text-white font-semibold text-sm leading-snug">{brief.greeting}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-200 hover:text-white transition-colors shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Items */}
      <div className="mt-2 flex flex-col gap-1.5 pl-5">
        {brief.items.map((item, idx) => {
          const Icon = TYPE_ICON[item.type] || Clock;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.link)}
              className="flex items-center gap-2 text-left group w-full"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLOR[item.priority] || "bg-blue-300"}`} />
              <Icon size={12} className="text-blue-200 shrink-0" />
              <span className="text-blue-50 text-xs group-hover:text-white transition-colors flex-1">
                {item.message}
              </span>
              <ArrowRight size={11} className="text-blue-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
