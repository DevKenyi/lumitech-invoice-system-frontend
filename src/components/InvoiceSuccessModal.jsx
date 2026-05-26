import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, ArrowRight, X } from "lucide-react";
import api from "../services/api";

const CELEBRATIONS = [
  "You're doing great! 🎉",
  "Another one sent! Keep going 💪",
  "That's how it's done! 🚀",
  "Invoice created! Your business is moving 📈",
  "Nice work! Stay on top of it 🙌",
];

function InvoiceSuccessModal({ onClose }) {
  const navigate = useNavigate();
  const [tip, setTip] = useState(null);
  const [headline] = useState(
    () => CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]
  );

  useEffect(() => {
    api.get("/api/tips/random")
      .then(res => setTip(res.data?.message ?? null))
      .catch(() => {});
  }, []);

  const handleOk = () => {
    onClose?.();
    navigate("/invoices");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">

        {/* Gradient top strip */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="p-7">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-3xl">✅</span>
          </div>

          {/* Headline */}
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white text-center mb-1">
            Invoice Created!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
            {headline}
          </p>

          {/* Tip */}
          {tip && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 mb-6">
              <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm">
                <Lightbulb size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                  Did you know?
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {tip}
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleOk}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:scale-[1.02] transition-all text-sm"
          >
            Got it — view my invoices
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceSuccessModal;
