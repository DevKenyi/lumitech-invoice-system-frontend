import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const STYLES = {
  success: { icon: CheckCircle, bar: "bg-emerald-500", classes: "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-700 text-slate-800 dark:text-slate-100" },
  error:   { icon: AlertCircle, bar: "bg-rose-500",    classes: "bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-700 text-slate-800 dark:text-slate-100" },
  info:    { icon: Info,        bar: "bg-blue-500",    classes: "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 text-slate-800 dark:text-slate-100" },
};

const ICON_COLOR = {
  success: "text-emerald-500",
  error:   "text-rose-500",
  info:    "text-blue-500",
};

export default function Toast({ visible = true, message, type = "info", onClose }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  const { icon: Icon, bar, classes } = STYLES[type] ?? STYLES.info;
  const iconColor = ICON_COLOR[type] ?? ICON_COLOR.info;

  return (
    <div className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border shadow-xl max-w-sm w-full sm:w-auto ${classes}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${bar}`} />
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5">
        <X size={14} />
      </button>
    </div>
  );
}
