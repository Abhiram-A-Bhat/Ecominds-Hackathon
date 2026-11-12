import React, { useState, useEffect } from 'react';

// ─── Guardian Campus Interactive Celebration Mascot (EcoBud) ─────────────────────────
// Smoothly pops up with randomized animated characters & gestures when achievements occur:
//   • THUMBS_UP: Cheerful green thumbs-up with blinking cute eyes & leaf wiggle
//   • COOL_SUNGLASSES: Pixel sunglasses slide down onto sprout with swagger
//   • SUPER_STAR: Golden cape & crown superhero sprout with spinning aura stars
//   • FLOWER_BLOOM: Flowering lotus burst with fluttering petals
//   • ZEN_MASTER: Levitating zen leaf with pulsing harmonic rings

export function EcoMascotPopup() {
  const [celebration, setCelebration] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleEvent = (e) => {
      if (!e.detail) return;
      setCelebration(e.detail);
      setIsVisible(true);

      // Auto-dismiss after 4.2 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4200);

      return () => clearTimeout(timer);
    };

    window.addEventListener('eco-celebration', handleEvent);
    return () => window.removeEventListener('eco-celebration', handleEvent);
  }, []);

  if (!celebration || !isVisible) return null;

  const { title, message, badge, variant } = celebration;

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999] pointer-events-auto dock-bl"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div 
        onClick={() => setIsVisible(false)}
        className="cursor-pointer relative overflow-hidden bg-slate-950/95 border-2 border-emerald-500/60 rounded-3xl p-4 shadow-2xl shadow-emerald-500/30 backdrop-blur-xl flex items-center gap-4 max-w-sm sm:max-w-md animate-in slide-in-from-bottom-8 duration-300 group hover:border-emerald-400 transition"
      >
        {/* Ambient Radial Flare */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Animated Mascot Character Avatar */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl shadow-inner p-1">
          {variant === 'COOL_SUNGLASSES' && <CoolGlassesMascot />}
          {variant === 'SUPER_STAR' && <SuperStarMascot />}
          {variant === 'FLOWER_BLOOM' && <FlowerBloomMascot />}
          {variant === 'ZEN_MASTER' && <ZenMasterMascot />}
          {(variant === 'THUMBS_UP' || !variant) && <ThumbsUpMascot />}
        </div>

        {/* Achievement Text & Details */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {variant === 'COOL_SUNGLASSES' && '😎 Too Cool!'}
              {variant === 'SUPER_STAR' && '🌟 Super Action!'}
              {variant === 'FLOWER_BLOOM' && '🌸 Blooming Green!'}
              {variant === 'ZEN_MASTER' && '🧘 Eco Harmony!'}
              {(variant === 'THUMBS_UP' || !variant) && '👍 Approved!'}
            </span>
            {badge && (
              <span className="text-[10px] font-black font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                {badge}
              </span>
            )}
          </div>

          <h4 className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight group-hover:text-emerald-300 transition">
            {title}
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          aria-label="Dismiss achievement notification"
          className="text-slate-500 hover:text-white text-xs p-1 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── 1. Thumbs Up Mascot (Cute animated sprout giving thumbs up) ────────────────
function ThumbsUpMascot() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {/* Glow Halo */}
      <circle cx="50" cy="55" r="35" fill="rgba(52,211,153,0.15)" className="animate-pulse" />

      {/* Sprout Body */}
      <ellipse cx="50" cy="62" rx="22" ry="24" fill="#10b981" />
      <ellipse cx="48" cy="58" rx="18" ry="19" fill="#34d399" />

      {/* Cheerful Eyes */}
      <ellipse cx="42" cy="54" rx="3.5" ry="5" fill="#064e3b" />
      <circle cx="43.5" cy="52" r="1.5" fill="#ffffff" />
      <ellipse cx="56" cy="54" rx="3.5" ry="5" fill="#064e3b" />
      <circle cx="57.5" cy="52" r="1.5" fill="#ffffff" />

      {/* Happy Smile */}
      <path d="M 44 64 Q 49 71 54 64" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Rosy Cheeks */}
      <circle cx="37" cy="61" r="3" fill="#f43f5e" opacity="0.6" />
      <circle cx="61" cy="61" r="3" fill="#f43f5e" opacity="0.6" />

      {/* Head Leaves - Wiggling */}
      <g className="origin-[50px_38px] animate-bounce">
        <path d="M 50 40 C 40 25, 25 28, 30 38 C 35 45, 45 42, 50 40 Z" fill="#22c55e" />
        <path d="M 50 40 C 60 22, 75 25, 70 36 C 65 44, 55 42, 50 40 Z" fill="#4ade80" />
      </g>

      {/* Thumbs Up Hand - Popping Out */}
      <g className="translate-x-3 -translate-y-1 animate-pulse">
        {/* Arm */}
        <path d="M 66 65 Q 74 62 76 56" stroke="#10b981" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Hand Fist */}
        <circle cx="78" cy="54" r="5" fill="#34d399" />
        {/* Thumb pointing up */}
        <rect x="76" y="44" width="4.5" height="10" rx="2.2" fill="#34d399" />
        {/* Sparkle */}
        <text x="82" y="44" fontSize="12" fill="#fef08a" className="animate-ping font-bold">✨</text>
      </g>
    </svg>
  );
}

// ─── 2. Cool Sunglasses Mascot (Sprout wearing retro shades with attitude) ─────
function CoolGlassesMascot() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {/* Background Radial Glow */}
      <circle cx="50" cy="55" r="35" fill="rgba(6,182,212,0.2)" className="animate-ping" style={{ animationDuration: '3s' }} />

      {/* Sprout Body */}
      <ellipse cx="50" cy="62" rx="22" ry="24" fill="#059669" />
      <ellipse cx="48" cy="58" rx="18" ry="19" fill="#10b981" />

      {/* Smug Smile */}
      <path d="M 44 65 Q 52 70 57 63" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Cool Leaves */}
      <g className="origin-[50px_38px]">
        <path d="M 50 38 C 38 20, 20 25, 26 36 C 32 44, 44 42, 50 38 Z" fill="#34d399" />
        <path d="M 50 38 C 62 18, 80 20, 74 34 C 68 42, 56 40, 50 38 Z" fill="#6ee7b7" />
      </g>

      {/* Pixel / Cool Sunglasses (Deal With It) */}
      <g className="transition-all duration-300 animate-in slide-in-from-top-6">
        {/* Left Lens */}
        <rect x="33" y="48" width="15" height="11" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Right Lens */}
        <rect x="52" y="48" width="15" height="11" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Bridge */}
        <line x1="47" y1="52" x2="53" y2="52" stroke="#38bdf8" strokeWidth="2" />
        {/* White Glare Bars */}
        <line x1="36" y1="50" x2="42" y2="56" stroke="#ffffff" strokeWidth="1.8" />
        <line x1="55" y1="50" x2="61" y2="56" stroke="#ffffff" strokeWidth="1.8" />
      </g>

      {/* Twinkle Stars */}
      <text x="18" y="45" fontSize="11" fill="#facc15" className="animate-spin">✦</text>
      <text x="75" y="42" fontSize="12" fill="#facc15" className="animate-pulse">✦</text>
    </svg>
  );
}

// ─── 3. Super Star Mascot (Superhero Sprout with Cape & Golden Crown) ──────────
function SuperStarMascot() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {/* Flowing Superhero Cape */}
      <path d="M 32 58 C 15 75, 10 92, 28 88 C 35 78, 40 68, 38 60 Z" fill="#e11d48" className="animate-pulse" />
      <path d="M 68 58 C 85 75, 90 92, 72 88 C 65 78, 60 68, 62 60 Z" fill="#f43f5e" />

      {/* Sprout Body */}
      <ellipse cx="50" cy="62" rx="22" ry="24" fill="#047857" />
      <ellipse cx="48" cy="58" rx="18" ry="19" fill="#10b981" />

      {/* Star Chest Emblem */}
      <circle cx="50" cy="65" r="7" fill="#fbbf24" />
      <text x="46" y="68.5" fontSize="9" fill="#78350f" fontWeight="bold">★</text>

      {/* Big Confident Eyes */}
      <ellipse cx="43" cy="53" rx="3.5" ry="4.5" fill="#064e3b" />
      <circle cx="44.5" cy="51" r="1.5" fill="#ffffff" />
      <ellipse cx="57" cy="53" rx="3.5" ry="4.5" fill="#064e3b" />
      <circle cx="58.5" cy="51" r="1.5" fill="#ffffff" />

      {/* Proud Smile */}
      <path d="M 45 61 Q 50 66 55 61" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Gold Crown */}
      <polygon points="40,38 45,45 50,36 55,45 60,38 58,48 42,48" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <circle cx="40" cy="38" r="2" fill="#ef4444" />
      <circle cx="50" cy="36" r="2" fill="#3b82f6" />
      <circle cx="60" cy="38" r="2" fill="#10b981" />

      {/* Sparkles */}
      <text x="75" y="35" fontSize="14" fill="#fbbf24" className="animate-bounce">🌟</text>
    </svg>
  );
}

// ─── 4. Flower Bloom Mascot (Seedling bursting into flowers) ───────────────────
function FlowerBloomMascot() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {/* Flower Petals Blooming */}
      <g className="origin-[50px_45px] animate-spin" style={{ animationDuration: '18s' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="28"
            rx="6.5"
            ry="14"
            fill={i % 2 === 0 ? '#ec4899' : '#f472b6'}
            transform={`rotate(${angle} 50 45)`}
            opacity="0.85"
          />
        ))}
      </g>

      {/* Sprout Body */}
      <ellipse cx="50" cy="66" rx="20" ry="22" fill="#059669" />
      <ellipse cx="48" cy="63" rx="16" ry="17" fill="#34d399" />

      {/* Joyful Closed Happy Eyes (^_^) */}
      <path d="M 40 58 Q 44 54 48 58" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 52 58 Q 56 54 60 58" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Wide Open Mouth */}
      <path d="M 46 66 Q 50 72 54 66 Z" fill="#064e3b" />

      {/* Rosy Cheeks */}
      <circle cx="37" cy="64" r="3.5" fill="#fb7185" opacity="0.7" />
      <circle cx="63" cy="64" r="3.5" fill="#fb7185" opacity="0.7" />

      {/* Fluttering Butterfly */}
      <g className="translate-x-6 -translate-y-2 animate-bounce">
        <text x="65" y="30" fontSize="16">🦋</text>
      </g>
    </svg>
  );
}

// ─── 5. Zen Master Mascot (Meditating Sprout with Lotus Halo) ──────────────────
function ZenMasterMascot() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      {/* Concentric Zen Rings */}
      <circle cx="50" cy="55" r="38" stroke="rgba(45,212,191,0.3)" strokeWidth="1.5" fill="none" className="animate-ping" style={{ animationDuration: '4s' }} />
      <circle cx="50" cy="55" r="30" stroke="rgba(45,212,191,0.4)" strokeWidth="1.5" fill="none" />

      {/* Meditating Sprout Body */}
      <g className="animate-bounce" style={{ animationDuration: '3s' }}>
        <ellipse cx="50" cy="58" rx="20" ry="22" fill="#0d9488" />
        <ellipse cx="49" cy="55" rx="16" ry="17" fill="#2dd4bf" />

        {/* Lotus Legs */}
        <ellipse cx="36" cy="74" rx="10" ry="5" fill="#0f766e" />
        <ellipse cx="64" cy="74" rx="10" ry="5" fill="#0f766e" />

        {/* Serene Peaceful Closed Eyes */}
        <path d="M 41 53 Q 45 56 49 53" stroke="#134e4a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 51 53 Q 55 56 59 53" stroke="#134e4a" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Gentle Zen Smile */}
        <path d="M 47 62 Q 50 65 53 62" stroke="#134e4a" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Golden Third Eye Sparkle */}
        <circle cx="50" cy="46" r="2.2" fill="#fde047" className="animate-pulse" />

        {/* Lotus Head Blossom */}
        <g className="translate-y-[-4px]">
          <path d="M 50 36 C 45 24, 34 26, 38 34 C 42 40, 48 38, 50 36 Z" fill="#5eead4" />
          <path d="M 50 36 C 55 24, 66 26, 62 34 C 58 40, 52 38, 50 36 Z" fill="#99f6e4" />
          <circle cx="50" cy="34" r="3" fill="#fef08a" />
        </g>
      </g>
    </svg>
  );
}
