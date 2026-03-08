import { useEffect } from 'react';

export default function Toast({ visible, message, type = 'info', onClose }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClose && onClose(), 3500);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-700';

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`${bg} text-white px-4 py-2 rounded-lg shadow-lg`}>{message}</div>
    </div>
  );
}
