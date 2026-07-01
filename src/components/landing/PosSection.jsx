import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle, Package, Smartphone, Zap,
  ShoppingCart, MessageCircle, BarChart2, Camera,
} from "lucide-react";

/* ── animated floating badge ────────────────────────────────── */
function FloatingBadge({ children, className = "", delay = 0 }) {
  return (
    <div
      className={`absolute z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 px-3 py-2.5 select-none ${className}`}
      style={{
        animation: `lumiFloat 4s ease-in-out ${delay}s infinite`,
      }}
    >
      {children}
    </div>
  );
}

/* ── phone mockup with live scanning animation ───────────────── */
function PhoneMockup() {
  const [scanned, setScanned] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const [scanPos, setScanPos] = useState(20);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // Reset state at start of each cycle
    setScanned(false);
    setCartCount(2);
    setScanPos(20);

    let pos = 20;
    let dir = 1;
    const interval = setInterval(() => {
      pos += dir * 2.5;
      if (pos >= 80) dir = -1;
      if (pos <= 20) dir = 1;
      setScanPos(pos);
    }, 40);

    const scanTimer  = setTimeout(() => setScanned(true),       1800);
    const cartTimer  = setTimeout(() => setCartCount(3),        2400);
    const resetTimer = setTimeout(() => setCycle(c => c + 1),  5800);

    return () => {
      clearInterval(interval);
      clearTimeout(scanTimer);
      clearTimeout(cartTimer);
      clearTimeout(resetTimer);
    };
  }, [cycle]);

  return (
    <div className="relative w-[260px] mx-auto select-none">
      {/* Phone body */}
      <div className="relative bg-slate-900 rounded-[2.5rem] p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-slate-700/60">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-10 flex items-center justify-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <div className="w-6 h-2 rounded-full bg-slate-800" />
        </div>

        {/* Screen */}
        <div className="bg-slate-950 rounded-[2rem] overflow-hidden" style={{ minHeight: 480 }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-8 pb-2">
            <span className="text-white text-[10px] font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2 border border-white/60 rounded-sm relative">
                <div className="absolute inset-0.5 right-0.5 bg-white/70 rounded-sm" style={{ right: "20%" }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-extrabold leading-none">LumiLedger POS</p>
              <p className="text-slate-500 text-[9px] mt-0.5">Scan or search product</p>
            </div>
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </div>
          </div>

          {/* Camera scan viewfinder */}
          <div className="mx-4 mb-3 relative overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-700/60" style={{ height: 190 }}>
            {/* Camera feed (simulated) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />

            {/* Corner markers */}
            {[
              "top-2 left-2 border-t-2 border-l-2 rounded-tl-lg",
              "top-2 right-2 border-t-2 border-r-2 rounded-tr-lg",
              "bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg",
              "bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg",
            ].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 border-orange-400 ${cls}`} />
            ))}

            {/* Simulated barcode in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end gap-0.5 opacity-50">
                {[3, 5, 2, 6, 3, 4, 7, 2, 5, 3, 6, 4, 3, 5, 2, 7, 3, 4].map((h, i) => (
                  <div key={i} className="bg-white/80 w-0.5" style={{ height: h * 4 }} />
                ))}
              </div>
            </div>

            {/* Animated scan line */}
            <div
              className="absolute left-4 right-4 h-0.5 pointer-events-none"
              style={{
                top: `${scanPos}%`,
                background: scanned
                  ? "rgba(34,197,94,0.9)"
                  : "rgba(251,146,60,0.9)",
                boxShadow: scanned
                  ? "0 0 12px 4px rgba(34,197,94,0.5)"
                  : "0 0 12px 4px rgba(251,146,60,0.4)",
                transition: "background 0.3s, box-shadow 0.3s",
              }}
            />

            {/* Scan hit flash */}
            {scanned && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
            )}

            {/* Scan status */}
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center">
              <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full ${
                scanned
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              }`}>
                {scanned ? "✓ Product found" : "Scanning…"}
              </span>
            </div>
          </div>

          {/* Scanned product card */}
          <div className={`mx-4 mb-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 p-3 transition-all duration-500 ${
            scanned ? "opacity-100 translate-y-0" : "opacity-40"
          }`}
            style={{ transform: scanned ? "translateY(0)" : "translateY(8px)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-orange-500/20 rounded-xl border border-orange-500/30 flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold leading-none">Indomie Noodles (Bag)</p>
                  <p className="text-slate-400 text-[9px] mt-0.5">SKU-00142 · Stock: 47</p>
                </div>
              </div>
              <p className="text-orange-400 text-sm font-extrabold">₦550</p>
            </div>
            <button className={`w-full mt-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 ${
              scanned
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                : "bg-slate-700 text-slate-500"
            }`}>
              {cartCount >= 3 ? "✓ Added to Cart" : "Add to Cart"}
            </button>
          </div>

          {/* Bottom bar */}
          <div className="mx-4 mb-4 flex items-center justify-between bg-slate-800/60 rounded-2xl px-3 py-2 border border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-slate-400 text-[9px]">Live stock sync</span>
            </div>
            <span className="text-orange-400 text-[10px] font-bold">{cartCount} items · ₦13,050</span>
          </div>

        </div>
      </div>

      {/* Floating badges */}
      <FloatingBadge className="-right-8 top-16" delay={0}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-800 leading-none">Inventory updated</p>
            <p className="text-[8px] text-slate-400 mt-0.5">Stock: 47 → 46</p>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge className="-left-10 top-40" delay={0.8}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-800 leading-none">Added to cart</p>
            <p className="text-[8px] text-emerald-600 font-semibold mt-0.5">₦550 · qty 1</p>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge className="-right-8 bottom-28" delay={1.6}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-3 h-3 text-green-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-800 leading-none">WhatsApp receipt</p>
            <p className="text-[8px] text-slate-400 mt-0.5">Sent to customer</p>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge className="-left-8 bottom-16" delay={2.4}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-3 h-3 text-violet-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-800 leading-none">Books updated</p>
            <p className="text-[8px] text-violet-600 font-semibold mt-0.5">Auto-posted to P&L</p>
          </div>
        </div>
      </FloatingBadge>

      {/* Keyframe styles */}
      <style>{`
        @keyframes lumiFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

/* ── main section ────────────────────────────────────────────── */
const BULLETS = [
  {
    icon: Camera,
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
    title: "Scan with your phone camera",
    desc: "No barcode gun. No ₦80,000 POS terminal. Just open the app, tap scan, and point your phone at any product.",
  },
  {
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/20",
    title: "Stock deducts automatically",
    desc: "Every sale reduces your inventory in real time. No manual counting. No end-of-day reconciliation nightmare.",
  },
  {
    icon: MessageCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    title: "Send receipts via WhatsApp",
    desc: "Customers get a professional PDF receipt by WhatsApp or email the moment the sale is complete.",
  },
  {
    icon: BarChart2,
    color: "text-violet-400",
    bg: "bg-violet-500/15 border-violet-500/20",
    title: "Every sale hits your books instantly",
    desc: "Sales post to your P&L and cash flow automatically. Your accountant will never chase you for records again.",
  },
];

export default function PosSection() {
  return (
    <section className="py-24 bg-[#0a0a0f] overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-orange-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Label */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-full text-xs font-bold tracking-wide">
            <Smartphone className="w-3.5 h-3.5" />
            Mobile POS · No hardware needed
          </span>
        </div>

        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            Turn Your Phone Into a{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Smart POS
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            No expensive terminals. No barcode guns. No setup costs.
            Scan products with your phone camera, build carts in seconds, and send WhatsApp receipts — all from one app.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="space-y-5 order-2 lg:order-1">

            {/* Retail pain stat */}
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-snug">
                  Most African retailers lose 15–20% of revenue to untracked sales.
                </p>
                <p className="text-slate-500 text-xs mt-0.5">LumiLedger POS closes that gap from day one.</p>
              </div>
            </div>

            {BULLETS.map(b => (
              <div key={b.title} className="flex gap-4 group">
                <div className={`w-11 h-11 rounded-xl ${b.bg} border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <b.icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <div>
                  <p className="font-bold text-white mb-1 text-sm">{b.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] transition-all text-sm"
              >
                Start Selling Today <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="flex items-center justify-center text-slate-500 text-xs">14-day free trial · No card required</span>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="flex justify-center order-1 lg:order-2 py-12 lg:py-0">
            <PhoneMockup />
          </div>

        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "< 3s",      label: "Average checkout time" },
            { value: "0 ₦",       label: "Hardware cost" },
            { value: "Real-time", label: "Stock tracking" },
            { value: "WhatsApp",  label: "Receipts delivered via" },
          ].map(s => (
            <div key={s.label} className="text-center p-5 bg-white/4 rounded-2xl border border-white/8 hover:border-orange-500/20 transition-colors">
              <p className="text-2xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
