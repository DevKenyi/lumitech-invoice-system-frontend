import { Link } from "react-router-dom";
import {
  ShoppingBag, ArrowRight, CheckCircle, Search,
  Barcode as Barcode2, Package as Package2,
  Printer as PrinterIcon, ShieldCheck as ShieldCheck2, Camera, Zap,
} from "lucide-react";

export default function PosSection() {
  return (
    <section className="py-24 bg-slate-900 overflow-hidden relative">
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-sm font-semibold">
            <ShoppingBag className="w-4 h-4" /> New — Optional POS for retail businesses
          </span>
        </div>

        {/* Barcode scanner hero callout */}
        <div className="relative mb-14 rounded-3xl overflow-hidden border border-orange-500/20 bg-gradient-to-br from-slate-800 via-slate-800 to-orange-950/40">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6 px-6 py-8 sm:px-10">
            {/* Pulsing camera icon */}
            <div className="relative flex-shrink-0">
              <span className="absolute inset-0 rounded-2xl bg-orange-500/30 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">
                <Zap className="w-3 h-3" /> Phone Barcode Scanner — No Hardware Needed
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug mb-2">
                Walk your shop floor, scan with your phone,<br className="hidden sm:block" />
                and the cart builds itself.
              </h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                No barcode gun. No separate scanner hardware. No extra cost. A business owner in Lagos or Accra just opens the POS on their phone, taps Scan, and every product jumps straight into the cart.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            You wake up early.<br className="hidden sm:block" />
            You close late.<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Your records should work as hard as you do.
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            From Alaba Market to Accra's Makola Market, from Cape Town's CBD to Lagos Island —
            every sale you make deserves to be counted. LumiLedger POS is built for how African retail actually works.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {[
              { icon: <Barcode2 className="w-5 h-5 text-orange-400" />,  bg: "bg-orange-500/15 border-orange-500/20",  title: "Barcode scan or quick search",  desc: "Scan any product with a barcode scanner or search by name. Your checkout moves as fast as your customer's patience." },
              { icon: <Package2 className="w-5 h-5 text-blue-400" />,   bg: "bg-blue-500/15 border-blue-500/20",    title: "Stock deducts automatically",  desc: "Every sale reduces your stock count in real time. No more end-of-day counting nightmares." },
              { icon: <PrinterIcon className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/15 border-emerald-500/20", title: "Print receipts + send by email", desc: "Connect any 80mm thermal printer via USB or Bluetooth. Print in one tap, or email a PDF receipt directly to your customer." },
              { icon: <ShieldCheck2 className="w-5 h-5 text-violet-400" />, bg: "bg-violet-500/15 border-violet-500/20", title: "Track every staff sale",        desc: "Know exactly who sold what and when. Stop shrinkage before it starts. Your sales report shows staff performance." },
            ].map(f => (
              <div key={f.title} className="flex gap-4">
                <div className={`w-11 h-11 rounded-xl ${f.bg} border flex items-center justify-center flex-shrink-0`}>{f.icon}</div>
                <div>
                  <p className="font-bold text-white mb-1">{f.title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] transition-all text-sm">
                Start Selling Today <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="flex items-center justify-center text-slate-500 text-xs">30-day free trial · No card required</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-blue-600/20 to-orange-600/10 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs text-slate-500 font-medium">LumiLedger — Point of Sale</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2 border border-slate-600">
                  <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-400 text-xs">Search products or scan barcode…</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Samsung Charger", price: "₦3,500",  stock: 12, active: true },
                    { name: "Screen Protector",price: "₦1,200",  stock: 45, active: false },
                    { name: "Power Bank 20K",  price: "₦18,500", stock: 6,  active: true },
                    { name: "Type-C Cable",    price: "₦800",    stock: 80, active: false },
                    { name: "Earphones",       price: "₦5,000",  stock: 0,  active: false },
                    { name: "Phone Case",      price: "₦2,200",  stock: 23, active: false },
                  ].map((p, i) => (
                    <div key={i} className={`rounded-xl p-2.5 border text-center ${
                      p.stock === 0 ? "opacity-40 border-slate-700 bg-slate-800/50" :
                      p.active ? "border-blue-500/60 bg-blue-500/15 shadow-md shadow-blue-500/20" :
                      "border-slate-700 bg-slate-800/80"
                    }`}>
                      <p className="text-white text-[10px] font-semibold leading-tight mb-1">{p.name}</p>
                      <p className="text-blue-400 text-[11px] font-bold">{p.price}</p>
                      <p className="text-slate-500 text-[9px] mt-0.5">{p.stock > 0 ? `${p.stock} left` : "Out of stock"}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Cart</p>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">3 items</span>
                  </div>
                  {[
                    { name: "Samsung Charger", qty: 2, total: "₦7,000" },
                    { name: "Power Bank 20K",  qty: 1, total: "₦18,500" },
                  ].map(c => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500/20 rounded text-blue-400 text-[9px] font-bold flex items-center justify-center">{c.qty}×</div>
                        <span className="text-slate-300 text-[10px]">{c.name}</span>
                      </div>
                      <span className="text-white text-[10px] font-bold">{c.total}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-300 text-xs font-bold">Total</span>
                    <span className="text-blue-400 text-sm font-extrabold">₦25,500</span>
                  </div>
                </div>
                <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                  <CheckCircle className="w-3.5 h-3.5" /> Charge ₦25,500
                </button>
              </div>
              <div className="absolute -right-3 -bottom-3 bg-white rounded-xl shadow-2xl px-3 py-2 flex items-center gap-2 border border-slate-100">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-800 leading-none">Sale complete!</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">Receipt printed & sent</p>
                </div>
              </div>
              <div className="absolute -left-4 top-24 bg-amber-500 text-white rounded-xl shadow-xl px-3 py-2 text-[10px] font-bold leading-tight border border-amber-400 max-w-[130px]">
                ⚠ Low stock alert<br /><span className="font-normal opacity-90">Power Bank: 6 left</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "< 3s",     label: "Average checkout time" },
            { value: "80mm",     label: "Thermal printer ready" },
            { value: "Real-time",label: "Stock tracking" },
            { value: "Zero",     label: "Manual counting needed" },
          ].map(s => (
            <div key={s.label} className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-2xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
