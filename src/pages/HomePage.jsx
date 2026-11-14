import React, { useMemo } from 'react';
import { ShieldIcon as Shield } from '@phosphor-icons/react/dist/csr/Shield';
import { MagnifyingGlassIcon as Search } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { ArrowRightIcon as ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { WarningIcon as AlertTriangle } from '@phosphor-icons/react/dist/csr/Warning';
import { LeafIcon as Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { RecycleIcon as Recycle } from '@phosphor-icons/react/dist/csr/Recycle';
import { CpuIcon as Cpu } from '@phosphor-icons/react/dist/csr/Cpu';
import { TrashIcon as Trash2 } from '@phosphor-icons/react/dist/csr/Trash';
import { TreeIcon as TreePine } from '@phosphor-icons/react/dist/csr/Tree';
import { ForkKnifeIcon as UtensilsCrossed } from '@phosphor-icons/react/dist/csr/ForkKnife';
import { ShieldCheckIcon as ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { ActivityIcon as Activity } from '@phosphor-icons/react/dist/csr/Pulse';
import { LightningIcon as Zap } from '@phosphor-icons/react/dist/csr/Lightning';
import { PlantIcon as Sprout } from '@phosphor-icons/react/dist/csr/Plant';
import { ClipboardTextIcon as ClipboardCheck } from '@phosphor-icons/react/dist/csr/ClipboardText';
import { PathIcon as Route } from '@phosphor-icons/react/dist/csr/Path';
import { VideoCameraIcon as Video } from '@phosphor-icons/react/dist/csr/VideoCamera';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { Link } from '../router/Router';
import { useAuth } from '../contexts/AuthContext';
import { getNavGroups } from '../config/navigation';
import { useInView, useTilt, useTweenedNumber } from '../hooks/useMotion';
import { useCountUp } from '../hooks/useScrollReveal';
import { WeatherWidget } from '../components/WeatherWidget';
import { usePlantCare } from '../hooks/usePlantCare';
import { careStatus } from '../services/plantCareService';

// Long-form pitch for each module, per role (the nav config holds the short desc)
const MODULE_COPY = {
  STUDENT: {
    '/adopt': { desc: 'Adopt one campus plant. Water it on time for +10 a cycle; skip a cycle and lose 15. The Overseer is watching.', badge: 'DAILY' },
    '/overseer': { desc: 'One student, fully anonymous, audits everyone’s plant care with photo evidence. Take the seat if it’s open.', badge: 'SECRET' },
    '/exchange': { desc: 'Seniors pass down notes, calculators, drafters and lab coats. Free for juniors; donors earn credits.', badge: 'FREE GEAR' },
    '/mess': { desc: 'Reserve a leftover cafeteria meal with EcoCredits or log a clean plate.', badge: 'SURPLUS' },
    '/bounties': { desc: 'Empty room with the projector on? Leaking tap? Snap it, alert staff, earn +35 when fixed.', badge: '+35 PTS' },
    '/trees': { desc: 'Every geo-tagged tree on the GIS map, with health and CO₂ sequestration.' },
    '/bins': { desc: 'Find the nearest smart bin for dry, wet and paper waste — with live fill levels.', badge: 'MAP' },
    '/leaderboard': { desc: 'Climb the lifetime ranks and redeem points for canteen meals and library perks.', badge: 'HALL OF FAME' },
    '/profile': { desc: 'Your badges, contribution history, vouchers and hand-me-down activity.' },
  },
  STAFF: {
    '/cleaner-ops': { desc: 'Forecasts canteen bin surges 30 min ahead and plans your shortest collection route.', badge: 'ROUTE' },
    '/bins': { desc: 'Live ultrasonic fill levels. Empty the critical ones and the map clears in real time.' },
    '/cctv-sentinel': { desc: 'AI spots empty rooms with power on and rings the Green Guardians. No remote cut-off — a person switches off.', badge: 'LIVE' },
    '/bounties': { desc: 'Leaks and phantom loads students reported, waiting for a fix.' },
    '/plant-reports': { desc: 'Anonymous Overseer photos of neglected plants. Uphold to dock the adopter’s points.', badge: 'AUDITS' },
    '/admin-verify': { desc: 'Approve drop-offs and photo evidence, then credit official EcoCredits.', badge: 'QUEUE' },
    '/scanner': { desc: 'Lab 104 intake: YOLO classifies material purity and allots verified credits to a USN.', badge: 'KIOSK' },
    '/ewaste': { desc: 'Harvest capacitors, MCUs and sensors for labs; log recoverable metals.' },
    '/mess': { desc: 'Broadcast safe leftover portions, pickup details and the EcoCredits price.' },
    '/trees': { desc: 'Campus tree map with health flags for the grounds team.' },
  },
  ADMIN: {
    '/cctv-sentinel': { desc: 'Empty-room detection across lecture halls. Guardians switch off by hand; you see every room’s status.', badge: 'AI' },
    '/overseer': { desc: 'See the anonymous Overseer seat’s activity and rotate the term — without ever learning who holds it.', badge: 'SEALED' },
    '/admin-verify': { desc: 'Review drop-offs, photo evidence and donations. Approve and credit official EcoCredits.', badge: 'QUEUE' },
    '/scanner': { desc: 'Lab 104 intake: YOLO classifies material purity and allots verified credits to a USN.', badge: 'KIOSK' },
    '/ewaste': { desc: 'Harvest capacitors, MCUs and sensors for labs; value recoverable metals before smelting.', badge: 'RoHS' },
    '/exchange': { desc: 'Quality-check donated gear and dispatch it to juniors under financial aid.' },
    '/admin': { desc: 'Digital twin of every ultrasonic bin, surge alarms and live simulation sliders.' },
    '/cleaner-ops': { desc: 'Forecasts canteen bin surges 30 min ahead and plans the shortest collection route.' },
    '/traceability': { desc: 'SHA-256 tamper-evident manifests from student locker to certified recycler.', badge: 'AUDIT' },
    '/audit': { desc: 'Criterion 7.1 synthesis: diversion, solar and paperless evidence, ready to print.' },
    '/rnsit-matrix': { desc: 'The 5-step closed-loop operational matrix behind all 40 campus ideas.' },
  },
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// ── Impact ring (credits → next milestone) ──────────────────────────────────
function ImpactRing({ value, max, label, sub, color = '#34d399' }) {
  const shown = useTweenedNumber(value, 1400);
  const R = 88, C = 2 * Math.PI * R;
  const pct = Math.min(shown / max, 1);
  const orbiters = [Recycle, TreePine, Zap, Leaf];
  return (
    <div style={{ position: 'relative', width: 230, height: 230, flexShrink: 0, animation: 'revealScale .9s var(--ease-out) .2s both' }} aria-label={`${value} of ${max} ${label}`}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: '1px dashed rgba(110,231,183,.18)', animation: 'orbit 40s linear infinite' }}>
        {orbiters.map((Icon, i) => (
          <span key={i} style={{
            position: 'absolute', left: '50%', top: '50%', width: 30, height: 30, margin: -15,
            transform: `rotate(${i * 90}deg) translateY(-129px) rotate(${-i * 90}deg)`,
          }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 10, background: 'rgba(5,17,11,.95)', border: '1px solid var(--border-hi)', color: 'var(--green-hi)', animation: 'orbit 40s linear infinite reverse' }}>
              <Icon size={14} />
            </span>
          </span>
        ))}
      </div>
      <svg width="230" height="230" viewBox="0 0 230 230" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx="115" cy="115" r={R} fill="none" stroke="rgba(110,231,183,.08)" strokeWidth="14" />
        <circle cx="115" cy="115" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ filter: `drop-shadow(0 0 10px ${color}88)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{shown.toLocaleString()}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

// ── Live ticker ─────────────────────────────────────────────────────────────
function Ticker({ items }) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="glass ticker" style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', marginBottom: 22, maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: `marquee ${items.length * 7}s linear infinite` }}>
        {loop.map((it, i) => {
          const Icon = it.icon;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border)' }}>
              <Icon size={14} color={it.color} />
              <strong style={{ color: it.color, fontWeight: 800 }}>{it.tag}</strong> {it.text}
            </span>
          );
        })}
      </div>
      <style>{`.ticker:hover > div { animation-play-state: paused; }`}</style>
    </div>
  );
}

// ── Stat card with count-up + sparkline ─────────────────────────────────────
function Sparkline({ points, color, play }) {
  const max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p - min) / (max - min || 1)) * 24}`).join(' L');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 30, marginTop: 12 }} aria-hidden="true">
      <path d={`M0,30 L${d} L100,30 Z`} fill={`${color}14`} style={{ opacity: play ? 1 : 0, transition: 'opacity 1s .6s' }} />
      <path d={`M${d}`} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke"
        style={{ strokeDasharray: 300, strokeDashoffset: play ? 0 : 300, transition: 'stroke-dashoffset 1.6s var(--ease-out)' }} />
    </svg>
  );
}

function StatCard({ value, suffix = '', label, color, trend, spark, i }) {
  const [ref, visible] = useInView();
  const count = useCountUp(value, 1600, visible);
  return (
    <div ref={ref} className="glass spotlight" style={{ padding: '18px 18px 14px', borderRadius: 18, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(18px)', transition: `opacity .6s var(--ease-out) ${i * 0.06}s, transform .6s var(--ease-out) ${i * 0.06}s`, '--spot': `${color}22` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)' }}>{label}</span>
        {trend && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#a3e635', fontFamily: 'JetBrains Mono, monospace' }}>{trend}</span>}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(24px, 2.6vw, 30px)', fontWeight: 800, color, marginTop: 6, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
        {count.toLocaleString()}<span style={{ fontSize: '0.5em', marginLeft: 3, color: 'var(--text-3)' }}>{suffix}</span>
      </div>
      <Sparkline points={spark} color={color} play={visible} />
    </div>
  );
}

// ── Module tile (tilt + spotlight) ──────────────────────────────────────────
function ModuleTile({ item, copy, index, featured }) {
  const tiltRef = useTilt(featured ? 4 : 6);
  const [ref, visible] = useInView({ threshold: 0.1 });
  const Icon = item.icon;
  const a = item.accent;
  return (
    <div ref={ref} style={{ gridColumn: featured ? 'span 2' : undefined, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px) scale(.97)', transition: `opacity .7s var(--ease-out) ${index * 0.05}s, transform .7s var(--ease-out) ${index * 0.05}s` }} className={featured ? 'tile-featured' : ''}>
      <Link
        to={item.path}
        ref={tiltRef}
        className="spotlight module-tile"
        style={{
          '--spot': `${a}26`, '--accent': a,
          display: 'flex', flexDirection: 'column', height: '100%', minHeight: featured ? 200 : 180,
          padding: 20, borderRadius: 20, textDecoration: 'none', overflow: 'hidden',
          background: featured ? `linear-gradient(135deg, ${a}1a, rgba(8,22,15,.75) 55%)` : 'var(--surface)',
          border: '1px solid var(--border)', backdropFilter: 'blur(14px)',
          transition: 'transform .35s var(--ease-out), border-color .25s, box-shadow .35s',
          transformStyle: 'preserve-3d',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="mt-icon" style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', color: a, background: `${a}1c`, border: `1px solid ${a}38` }}>
            <Icon size={20} strokeWidth={2.2} />
          </span>
        </div>
        <div style={{ fontSize: featured ? 19 : 15.5, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.015em', marginBottom: 6 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, flex: 1, maxWidth: featured ? 460 : undefined }}>{copy?.desc || item.desc}</div>
        <div className="mt-cta" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 12.5, fontWeight: 800, color: a }}>
          Explore {item.title} <ArrowRight size={14} className="mt-arrow" />
        </div>
      </Link>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export const HomePage = ({ bins, userCredits, salvagedItems, trees, surplusAlerts = [], onOpenGuardians, onOpenSearch }) => {
  const { currentUser, role, roleMeta, isStudent, isStaff, isOperator: isAdmin } = useAuth();
  const plantState = usePlantCare();
  const myPlant = isStudent ? plantState.plants.find(p => p.adopterId === currentUser?.id) : null;
  const myPlantStatus = myPlant ? careStatus(myPlant, plantState.now) : null;
  const pendingAudits = plantState.reports.filter(r => r.status === 'PENDING').length;
  const criticalBins = bins.filter(b => b.fillLevel >= 80);
  // Same grouping as the sidebar; tiny groups are pooled so no section has a lone tile
  const groups = useMemo(() => {
    const all = getNavGroups(role).map(g => ({ ...g, items: g.items.filter(i => i.path !== '/') }));
    const big = all.filter(g => g.items.length >= 2);
    const pooled = all.filter(g => g.items.length === 1).flatMap(g => g.items);
    if (pooled.length) big.push({ label: { STUDENT: 'You & rewards', STAFF: 'More tools', ADMIN: 'Consoles & rewards' }[role], items: pooled });
    return big;
  }, [role]);
  const firstName = (currentUser?.name || '').replace(/^Dr\.\s*/, '').split(' ')[0];

  const nextMilestone = Math.max(500, Math.ceil((userCredits + 1) / 250) * 250);

  const tickerItems = useMemo(() => [
    ...criticalBins.map(b => ({ icon: AlertTriangle, color: '#f87171', tag: `${b.fillLevel}%`, text: `${b.name} needs collection` })),
    ...surplusAlerts.filter(s => s.status === 'ACTIVE').map(s => ({ icon: UtensilsCrossed, color: '#fbbf24', tag: 'SURPLUS', text: `${s.location} · ${s.postedAt}` })),
    { icon: TreePine, color: '#4ade80', tag: `${trees.length} TREES`, text: 'geo-tagged and sequestering CO₂' },
    { icon: Cpu, color: '#60a5fa', tag: `${salvagedItems.length} PARTS`, text: 'salvaged and ready for lab checkout' },
    { icon: Recycle, color: '#a78bfa', tag: 'PASS-THE-TORCH', text: 'new senior gear listed this week' },
  ], [criticalBins, surplusAlerts, trees.length, salvagedItems.length]);

  const stats = [
    { value: 1685, suffix: 'kg', label: 'Waste diverted', color: '#34d399', trend: '+12%', spark: [4, 6, 5, 8, 7, 10, 12] },
    { value: 370, suffix: 'kg', label: 'E-waste salvaged', color: '#60a5fa', trend: '+8%', spark: [3, 4, 4, 5, 7, 6, 8] },
    { value: 4820, suffix: 'kg', label: 'CO₂ prevented', color: '#2dd4bf', trend: '+15%', spark: [5, 5, 7, 8, 9, 11, 13] },
    { value: bins.length - criticalBins.length, suffix: `/${bins.length}`, label: 'Bins healthy', color: criticalBins.length ? '#fbbf24' : '#a3e635', spark: [6, 7, 5, 6, 7, 6, bins.length - criticalBins.length] },
  ];

  const pendingCount = currentUser?.pendingContributions?.length || 0;

  return (
    <div style={{ position: 'relative' }} data-own-motion>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="home-hero glass" style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(24px, 4vw, 44px)', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 'clamp(24px, 4vw, 56px)', background: 'linear-gradient(120deg, var(--role-soft), rgba(8,22,15,.72) 45%, rgba(163,230,53,.05))' }}>
        <div aria-hidden="true" style={{ position: 'absolute', width: 380, height: 380, right: -80, top: -120, background: 'radial-gradient(circle, color-mix(in srgb, var(--role) 26%, transparent), transparent 65%)', animation: 'blobMorph 16s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <span className="chip" style={{ marginBottom: 18, animation: 'revealUp .6s var(--ease-out) both' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span style={{ color: roleMeta?.accent, fontWeight: 800 }}>{roleMeta?.title}</span> · {isAdmin ? `${currentUser?.designation || currentUser?.department}` : `${currentUser?.usn} · ${currentUser?.branch}`}
          </span>
          <h1 style={{ fontSize: 'clamp(32px, 4.6vw, 56px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.045em', margin: '0 0 14px', animation: 'revealUp .7s var(--ease-out) .06s both' }}>
            {greeting()}, {firstName}.<br />
            <span className="gradient-text">{isStaff ? 'The grounds are yours today.' : isAdmin ? 'Campus is under watch.' : 'Let’s heal the campus.'}</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px, 1.4vw, 16.5px)', color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 560, margin: '0 0 24px', animation: 'revealUp .7s var(--ease-out) .12s both' }}>
            {isStaff
              ? <><strong style={{ color: criticalBins.length ? '#f87171' : 'var(--green)' }}>{criticalBins.length} bin{criticalBins.length === 1 ? '' : 's'}</strong> at critical fill and <strong style={{ color: pendingAudits ? '#f472b6' : 'var(--green)' }}>{pendingAudits} plant audit{pendingAudits === 1 ? '' : 's'}</strong> waiting for your verdict. Empty rooms ring the Green Guardians automatically.</>
              : isAdmin
              ? <>There {criticalBins.length === 1 ? 'is' : 'are'} <strong style={{ color: criticalBins.length ? '#f87171' : 'var(--green)' }}>{criticalBins.length} bin{criticalBins.length === 1 ? '' : 's'}</strong> at critical fill. Verify student work, watch the Overseer seat and keep the campus audit-ready.</>
              : <>You’ve earned <strong style={{ color: 'var(--green-hi)' }}>{userCredits} EcoCredits</strong>{pendingCount ? <> with <strong style={{ color: 'var(--amber)' }}>{pendingCount} pending</strong> verification</> : ''}. {myPlant ? <> Your {myPlant.name} is <strong style={{ color: { healthy: 'var(--green)', thirsty: '#fbbf24', overdue: '#f87171', flagged: '#f472b6' }[myPlantStatus.level] }}>{myPlantStatus.level}</strong>.</> : ' Adopt a plant to start a daily streak.'} Keep the app open — task alarms ring here first.</>}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, animation: 'revealUp .7s var(--ease-out) .18s both' }}>
            {isStaff ? (
              <>
                <Link to="/plant-reports" className="btn-eco" style={{ padding: '12px 20px', fontSize: 13.5, textDecoration: 'none' }}><ClipboardCheck size={16} /> Plant audits{pendingAudits ? ` (${pendingAudits})` : ''}</Link>
                <Link to="/cleaner-ops" className="btn-ghost" style={{ padding: '12px 18px', fontSize: 13.5, textDecoration: 'none' }}><Route size={16} /> Ground ops</Link>
                <Link to="/cctv-sentinel" className="btn-ghost" style={{ padding: '12px 18px', fontSize: 13.5, textDecoration: 'none' }}><Video size={16} /> Sentinel</Link>
              </>
            ) : isAdmin ? (
              <>
                <Link to="/admin-verify" className="btn-eco" style={{ padding: '12px 20px', fontSize: 13.5, textDecoration: 'none' }}><ShieldCheck size={16} /> Verification desk</Link>
                <Link to="/overseer" className="btn-ghost" style={{ padding: '12px 18px', fontSize: 13.5, textDecoration: 'none' }}><Eye size={16} /> Overseer seat</Link>
                <Link to="/admin" className="btn-ghost" style={{ padding: '12px 18px', fontSize: 13.5, textDecoration: 'none' }}><Activity size={16} /> IoT console</Link>
              </>
            ) : (
              <>
                <button type="button" onClick={onOpenGuardians} className="btn-eco" style={{ padding: '12px 20px', fontSize: 13.5, fontFamily: 'inherit' }}><Shield size={16} /> Guardian missions</button>
                <Link to="/adopt" className="btn-ghost" style={{ padding: '12px 18px', fontSize: 13.5, textDecoration: 'none' }}><Sprout size={16} /> {myPlant ? `Water ${myPlant.name}` : 'Adopt a plant'}</Link>
              </>
            )}
            <button type="button" onClick={onOpenSearch} className="btn-ghost" style={{ padding: '12px 16px', fontSize: 13.5, fontFamily: 'inherit', color: 'var(--text-2)' }}>
              <Search size={15} /> Jump to… <kbd style={{ fontSize: 10, opacity: .7 }}>⌘K</kbd>
            </button>
          </div>
        </div>
        <div className="hero-ring">
          {isAdmin
            ? <ImpactRing value={bins.length - criticalBins.length} max={bins.length} label="bins healthy" sub={`${criticalBins.length} need collection`} color={criticalBins.length ? '#fbbf24' : '#34d399'} />
            : <ImpactRing value={userCredits} max={nextMilestone} label="EcoCredits" sub={`${nextMilestone - userCredits} to next milestone`} />}
        </div>
      </section>

      <Ticker items={tickerItems} />

      {/* ── Critical alert ───────────────────────────────────────────── */}
      {criticalBins.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 16, marginBottom: 22, background: 'linear-gradient(90deg, rgba(239,68,68,.12), rgba(239,68,68,.03))', border: '1px solid rgba(239,68,68,.25)' }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(239,68,68,.15)', color: '#f87171', animation: 'breathe 2s ease-in-out infinite' }}>
            <Trash2 size={17} />
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fca5a5' }}>{criticalBins.length} bin{criticalBins.length > 1 ? 's' : ''} need urgent collection</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{criticalBins.map(b => b.name).join(' · ')}</div>
          </div>
          <Link to={isStaff ? '/cleaner-ops' : '/bins'} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5, textDecoration: 'none', color: '#fca5a5', borderColor: 'rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)' }}>
            {isStaff ? 'Dispatch route' : 'View on map'} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, marginBottom: 40 }}>
        {stats.map((s, i) => <StatCard key={s.label} {...s} i={i} />)}
      </section>

      {/* ── Modules, grouped exactly like the sidebar ───────────────── */}
      {groups.map((group, gi) => (
        <section key={group.label} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontSize: 'clamp(18px, 2vw, 22px)', fontWeight: 900, letterSpacing: '-0.025em', margin: 0 }}>{group.label}</h2>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-hi), transparent)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{String(group.items.length).padStart(2, '0')}</span>
          </div>
          <div className="module-grid">
            {group.items.map((item, i) => (
              <ModuleTile key={item.path} item={item} copy={MODULE_COPY[role]?.[item.path]} index={i} featured={gi === 0 && i === 0 && group.items.length > 1} />
            ))}
          </div>
        </section>
      ))}

      {/* ── Context strip: weather + SDGs ────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 14, marginBottom: 12 }}>
        <div className="glass" style={{ borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <div className="eyebrow">Bengaluru right now</div>
          <WeatherWidget />
        </div>
        <div className="glass" style={{ borderRadius: 20, padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Aligned with</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { code: 'SDG 11', color: '#facc15', title: 'Sustainable cities' },
              { code: 'SDG 12', color: '#34d399', title: 'Responsible consumption' },
              { code: 'SDG 13', color: '#60a5fa', title: 'Climate action' },
              { code: 'LiFE', color: '#2dd4bf', title: 'Pro-Planet People' },
            ].map((s, i) => (
              <div key={s.code} className="spotlight" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', '--spot': `${s.color}22`, animation: `staggerIn .5s var(--ease-out) ${i * 0.06}s backwards` }}>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: s.color }}>{s.code}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{s.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .module-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
        .module-tile:hover { border-color: color-mix(in srgb, var(--accent) 40%, transparent) !important; box-shadow: 0 24px 50px -20px rgba(0,0,0,.7), 0 0 40px -18px var(--accent); }
        .module-tile .mt-icon { transition: transform .4s var(--ease-spring); }
        .module-tile:hover .mt-icon { transform: scale(1.1) rotate(-8deg) translateZ(20px); }
        .module-tile .mt-arrow { transition: transform .3s var(--ease-out); }
        .module-tile:hover .mt-arrow { transform: translateX(5px); }
        @media (max-width: 640px) { .tile-featured { grid-column: auto !important; } }
        @media (max-width: 860px) { .home-hero { flex-direction: column; align-items: flex-start !important; } .hero-ring { align-self: center; margin: 12px 0; } }
      `}</style>
    </div>
  );
};
