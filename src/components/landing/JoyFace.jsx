import useInView from "../../hooks/useInView";

function AfricanWomanSVG() {
  return (
    <svg viewBox="0 0 220 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* ── Glow halo ── */}
      <ellipse cx="110" cy="128" rx="88" ry="92" fill="url(#halo)" opacity="0.35" />

      {/* ── Neck ── */}
      <rect x="90" y="178" width="40" height="36" rx="12" fill="#B5692A" />

      {/* ── Shoulders / clothing ── */}
      <path d="M38 236 Q60 192 110 192 Q160 192 182 236Z" fill="url(#top)" />
      {/* collar accent */}
      <path d="M88 194 Q110 208 132 194" stroke="#F4A44A" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* ── Face shape ── */}
      <ellipse cx="110" cy="128" rx="70" ry="76" fill="url(#skin)" />

      {/* ── Cheek blush ── */}
      <ellipse cx="72" cy="148" rx="14" ry="9" fill="#D4783A" opacity="0.3" />
      <ellipse cx="148" cy="148" rx="14" ry="9" fill="#D4783A" opacity="0.3" />

      {/* ── Natural hair — afro ── */}
      {/* Base dome */}
      <ellipse cx="110" cy="80" rx="72" ry="66" fill="#1A0A00" />
      {/* Textured puffs for afro volume */}
      <circle cx="50"  cy="88"  r="26" fill="#231208" />
      <circle cx="170" cy="88"  r="26" fill="#231208" />
      <circle cx="78"  cy="54"  r="28" fill="#1F0F03" />
      <circle cx="142" cy="54"  r="28" fill="#1F0F03" />
      <circle cx="110" cy="42"  r="30" fill="#250D00" />
      <circle cx="60"  cy="66"  r="22" fill="#1A0A00" />
      <circle cx="160" cy="66"  r="22" fill="#1A0A00" />
      {/* Hair sheen */}
      <ellipse cx="102" cy="52" rx="18" ry="10" fill="#3B1A08" opacity="0.5" transform="rotate(-15 102 52)" />

      {/* ── Hairline fade into forehead ── */}
      <ellipse cx="110" cy="95" rx="66" ry="18" fill="url(#skin)" />

      {/* ── Eyebrows ── */}
      <path d="M78 112 Q90 105 102 112" stroke="#2D1000" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M118 112 Q130 105 142 112" stroke="#2D1000" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* ── Eyes ── */}
      {/* Left eye */}
      <ellipse cx="90" cy="124" rx="13" ry="10" fill="white" />
      <circle cx="90" cy="124" r="7" fill="#2D1B06" />
      <circle cx="90" cy="124" r="4" fill="#0A0500" />
      <circle cx="93" cy="121" r="2.5" fill="white" />
      {/* Left eyelids */}
      <path d="M77 124 Q90 116 103 124" stroke="#2D1000" strokeWidth="1.8" fill="none" />
      <path d="M78 125 Q90 132 102 125" stroke="#2D1000" strokeWidth="1.5" fill="none" />

      {/* Right eye */}
      <ellipse cx="130" cy="124" rx="13" ry="10" fill="white" />
      <circle cx="130" cy="124" r="7" fill="#2D1B06" />
      <circle cx="130" cy="124" r="4" fill="#0A0500" />
      <circle cx="133" cy="121" r="2.5" fill="white" />
      {/* Right eyelids */}
      <path d="M117 124 Q130 116 143 124" stroke="#2D1000" strokeWidth="1.8" fill="none" />
      <path d="M118 125 Q130 132 142 125" stroke="#2D1000" strokeWidth="1.5" fill="none" />

      {/* ── Nose ── */}
      <path d="M104 134 Q110 145 116 134" stroke="#9B5422" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="104" cy="143" rx="5" ry="3.5" fill="#A85E2A" opacity="0.6" />
      <ellipse cx="116" cy="143" rx="5" ry="3.5" fill="#A85E2A" opacity="0.6" />

      {/* ── Big joyful smile ── */}
      {/* Mouth opening */}
      <path d="M82 158 Q110 180 138 158" fill="#5C1A08" />
      {/* Teeth */}
      <path d="M82 158 Q110 168 138 158 Q110 172 82 158Z" fill="white" />
      {/* Tooth lines */}
      <line x1="101" y1="158" x2="101" y2="168" stroke="#E8E8E8" strokeWidth="0.8" />
      <line x1="110" y1="158" x2="110" y2="169" stroke="#E8E8E8" strokeWidth="0.8" />
      <line x1="119" y1="158" x2="119" y2="168" stroke="#E8E8E8" strokeWidth="0.8" />
      {/* Lip curves */}
      <path d="M82 158 Q110 152 138 158" stroke="#7A3018" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M82 158 Q110 180 138 158" stroke="#7A3018" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile dimples */}
      <circle cx="80" cy="160" r="3.5" fill="#A85E2A" opacity="0.5" />
      <circle cx="140" cy="160" r="3.5" fill="#A85E2A" opacity="0.5" />

      {/* ── Ear studs ── */}
      <circle cx="40" cy="134" r="5" fill="#F4C842" />
      <circle cx="40" cy="134" r="2.5" fill="#FDE68A" />
      <circle cx="180" cy="134" r="5" fill="#F4C842" />
      <circle cx="180" cy="134" r="2.5" fill="#FDE68A" />

      {/* ── Joy sparkles ── */}
      <g opacity="0.9">
        {/* top-left star */}
        <path d="M30 48 L32 42 L34 48 L40 50 L34 52 L32 58 L30 52 L24 50Z" fill="#FBBF24" />
        {/* top-right star */}
        <path d="M178 36 L180 30 L182 36 L188 38 L182 40 L180 46 L178 40 L172 38Z" fill="#60A5FA" />
        {/* right floating star */}
        <path d="M188 100 L190 95 L192 100 L197 102 L192 104 L190 109 L188 104 L183 102Z" fill="#A78BFA" />
        {/* left small dot cluster */}
        <circle cx="22" cy="110" r="3.5" fill="#34D399" />
        <circle cx="28" cy="102" r="2"   fill="#34D399" opacity="0.6" />
        <circle cx="16" cy="104" r="2"   fill="#34D399" opacity="0.5" />
        {/* top sparkle dots */}
        <circle cx="110" cy="18" r="3"   fill="#FBBF24" />
        <circle cx="122" cy="12" r="2"   fill="#FBBF24" opacity="0.6" />
        <circle cx="98"  cy="14" r="1.8" fill="#FBBF24" opacity="0.5" />
        {/* right top twinkle */}
        <path d="M196 62 L197.5 58 L199 62 L203 63.5 L199 65 L197.5 69 L196 65 L192 63.5Z" fill="#FCD34D" opacity="0.8" />
      </g>

      {/* ── Gradients ── */}
      <defs>
        <radialGradient id="skin" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#D4844A" />
          <stop offset="60%" stopColor="#C07038" />
          <stop offset="100%" stopColor="#9E5422" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function JoyFace() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="py-20 bg-[#0a0a0f] overflow-hidden">
      <div
        ref={ref}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-10 md:gap-16"
      >
        {/* Face */}
        <div
          className="flex-shrink-0 w-52 h-64 relative"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "scale(1) translateY(0)" : "scale(0.88) translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* Ambient glow behind the face */}
          <div className="absolute inset-0 -m-6 rounded-full bg-amber-500/10 blur-2xl" />
          <AfricanWomanSVG />
        </div>

        {/* Quote */}
        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(32px)",
            transition: "opacity 0.7s ease 0.18s, transform 0.7s ease 0.18s",
          }}
        >
          <div className="text-3xl text-amber-400 font-serif leading-none mb-4 select-none">"</div>
          <p className="text-xl sm:text-2xl font-semibold text-white leading-snug mb-5">
            I used to dread checking my books.
            Now I open my dashboard every morning with a{" "}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent font-extrabold">
              big smile.
            </span>
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
            For the first time I know exactly what my business owes me, which invoices are outstanding, and whether I'm actually making a profit. LumiLedger gave me clarity I never had with spreadsheets.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
              AO
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Adaeze Okonkwo</p>
              <p className="text-xs text-slate-500">Fashion retailer · Lagos, Nigeria</p>
            </div>
            <div className="ml-auto flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
