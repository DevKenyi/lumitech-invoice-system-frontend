import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import releaseNotes from "../data/releaseNotes";

const SEEN_KEY = "whatsNewSeenAt";

export default function WhatsNewBell({ align = "right" }) {
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const latest = releaseNotes[0]?.date;
    const seenAt = localStorage.getItem(SEEN_KEY);
    setUnseen(Boolean(latest) && (!seenAt || latest > seenAt));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && releaseNotes[0]) {
      localStorage.setItem(SEEN_KEY, releaseNotes[0].date);
      setUnseen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
        title="What's new"
      >
        <Sparkles size={20} />
        {unseen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        )}
      </button>

      {open && (
        <div
          className={`absolute mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                What's new
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <X size={15} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
            {releaseNotes.map((entry) => (
              <div key={entry.date} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {entry.title}
                  </p>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {entry.date}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {entry.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-300 dark:before:text-slate-600"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
