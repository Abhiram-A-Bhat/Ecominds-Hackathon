import React, { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon as Search } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { ShieldIcon as Shield } from '@phosphor-icons/react/dist/csr/Shield';
import { FlameIcon as Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { RobotIcon as Bot } from '@phosphor-icons/react/dist/csr/Robot';
import { WalletIcon as Wallet } from '@phosphor-icons/react/dist/csr/Wallet';
import { CaretRightIcon as ChevronRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CaretDownIcon as ChevronDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { SignOutIcon as LogOut } from '@phosphor-icons/react/dist/csr/SignOut';
import { UserCircleIcon as UserRound } from '@phosphor-icons/react/dist/csr/UserCircle';
import { TrophyIcon as Trophy } from '@phosphor-icons/react/dist/csr/Trophy';
import { ShieldCheckIcon as ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { ListIcon as Menu } from '@phosphor-icons/react/dist/csr/List';
import { PlantIcon as Sprout } from '@phosphor-icons/react/dist/csr/Plant';
import { ClipboardTextIcon as ClipboardCheck } from '@phosphor-icons/react/dist/csr/ClipboardText';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { ArrowsClockwiseIcon as Repeat2 } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { INTERFACES } from '../../config/demoAccounts';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../contexts/AuthContext';
import { guardianTaskService } from '../../services/guardianTaskService';
import { getRoute, getGroupOf } from '../../config/navigation';
import { useScrollState, useTweenedNumber } from '../../hooks/useMotion';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from '../ThemeToggle';
import { PixelGuardian } from './PixelGuardian';

function WalletChip({ credits }) {
  const shown = useTweenedNumber(credits);
  const prev = useRef(credits);
  const [floats, setFloats] = useState([]);

  useEffect(() => {
    const delta = credits - prev.current;
    prev.current = credits;
    if (!delta) return;
    const id = Date.now() + Math.random();
    setFloats(f => [...f, { id, delta }]);
    const t = setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1400);
    return () => clearTimeout(t);
  }, [credits]);

  return (
    <Link to="/leaderboard" className="tb-btn" style={{ color: 'var(--text)', gap: 9, paddingRight: 14 }} aria-label={`EcoCredits wallet: ${credits} points`}>
      <span style={{ width: 24, height: 24, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#a3e635,#10b981)', color: '#022c1c' }}>
        <Wallet size={13} strokeWidth={2.6} />
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }}>
        {shown.toLocaleString()}
      </span>
      <span style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 800 }} className="hide-sm">pts</span>
      {floats.map(f => (
        <span key={f.id} className="credit-float" style={{ color: f.delta > 0 ? 'var(--lime)' : 'var(--red)' }}>
          {f.delta > 0 ? '+' : ''}{f.delta}
        </span>
      ))}
    </Link>
  );
}

/** Presenter tool: jump straight into another interface with a seeded demo account. */
function InterfaceSwitcher() {
  const { currentUser, login } = useAuth();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const go = (acc) => {
    setOpen(false);
    if (login(acc.id, acc.pw)) { navigate('/'); window.scrollTo({ top: 0, behavior: 'instant' }); }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="tb-btn" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} title="Switch interface (demo)">
        <Repeat2 size={15} /> <span className="hide-md">Switch</span>
      </button>
      {open && (
        <div className="menu-pop iface-menu" role="menu">
          <div className="eyebrow" style={{ padding: '6px 10px 8px' }}>Jump to another interface</div>
          {INTERFACES.map((it, gi) => (
            <div key={it.role} style={{ padding: '4px 0', borderTop: gi ? '1px solid var(--border)' : 0, animation: `revealRight .3s var(--ease-out) ${gi * 0.05}s backwards` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 4px', fontSize: 11.5, fontWeight: 800, color: it.color }}>
                <it.icon size={13} /> {it.title} <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>· {it.who}</span>
              </div>
              {it.accounts.map(acc => {
                const here = currentUser && (currentUser.usn === acc.id || currentUser.username === acc.id);
                return (
                  <button key={acc.id} type="button" role="menuitem" className="iface-row" aria-current={here} onClick={() => !here && go(acc)}>
                    <span style={{ fontSize: 18 }}>{acc.avatar}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{acc.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.meta}</span>
                    </span>
                    {here && <span style={{ fontSize: 10.5, fontWeight: 800, color: it.color }}>YOU</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { currentUser, role, roleMeta, isStudent, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!currentUser) return null;
  const items = {
    STUDENT: [{ to: '/profile', label: 'My profile', icon: UserRound }, { to: '/adopt', label: 'My plant', icon: Sprout }, { to: '/leaderboard', label: 'Rewards & ranks', icon: Trophy }],
    STAFF: [{ to: '/plant-reports', label: 'Plant care audits', icon: ClipboardCheck }, { to: '/admin-verify', label: 'Verification desk', icon: ShieldCheck }],
    ADMIN: [{ to: '/admin-verify', label: 'Verification desk', icon: ShieldCheck }, { to: '/overseer', label: 'Overseer seat', icon: Eye }],
  }[role] || [];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="tb-btn"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        style={{ paddingLeft: 5, gap: 6 }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 15,
          background: roleMeta?.tint,
        }}>{currentUser.avatar || '🌱'}</span>
        <ChevronDown size={14} style={{ transition: 'transform var(--dur-2) var(--ease-out)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: roleMeta?.accent, marginTop: 3, letterSpacing: '.04em', textTransform: 'uppercase' }}>{roleMeta?.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginTop: 2 }}>
              {isStudent ? `${currentUser.usn} · ${currentUser.branch} · Year ${currentUser.year}` : currentUser.designation}
            </div>
          </div>
          {items.map(({ to, label, icon: Icon }, i) => (
            <Link key={to} to={to} className="menu-item" role="menuitem" onClick={() => setOpen(false)}
              style={{ animation: `revealRight .3s var(--ease-out) ${i * 0.04}s backwards` }}>
              <Icon size={15} /> {label}
            </Link>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <button type="button" className="menu-item danger" role="menuitem" onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ userCredits, onOpenSearch, onOpenGamification, onOpenActionMesh, onOpenGuardians, onOpenDrawer }) {
  const { path } = useRouter();
  const { role, roleMeta, isStudent } = useAuth();
  const route = getRoute(path, role);
  const group = getGroupOf(path, role);
  const { scrolled, progress } = useScrollState();
  const [openTasks, setOpenTasks] = useState(() => guardianTaskService.getOpenCount());

  useEffect(() => guardianTaskService.subscribe(tasks => setOpenTasks(tasks.filter(t => t.status === 'OPEN').length)), []);

  const Icon = route?.icon;

  return (
    <header className={`topbar ${scrolled ? 'scrolled' : ''}`} role="banner">
      {/* Mobile: menu + brand */}
      <button type="button" className="tb-btn show-lt-lg" onClick={onOpenDrawer} aria-label="Open navigation menu" style={{ padding: 0 }}>
        <Menu size={18} />
      </button>
      <Link to="/" className="show-lt-lg hide-sm" aria-label="Guardian Campus home" style={{ display: 'flex' }}>
        <BrandMark size={32} />
      </Link>

      {/* Breadcrumb / current page */}
      {route && (
        <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 0', overflow: 'hidden', animation: 'revealLeft .45s var(--ease-out) backwards' }}>
          <span className="hide-sm" style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
            color: route.accent, background: `${route.accent}1f`, border: `1px solid ${route.accent}40`,
            boxShadow: `0 0 20px -6px ${route.accent}`,
          }}>
            {Icon && <Icon size={15} strokeWidth={2.3} />}
          </span>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div className="hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>
              {group}<ChevronRight size={10} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {route.title}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
        {roleMeta && <span className="role-ribbon hide-md" title="Interface you are viewing"><PixelGuardian />{roleMeta.title}</span>}
        <ThemeToggle />
        <InterfaceSwitcher />

        <button type="button" className="tb-btn tb-search" onClick={onOpenSearch} aria-label="Search (Ctrl+K)" title="Search  ⌘K">
          <Search size={15} />
          <span className="tb-search-text">Search modules, bins…</span>
          <kbd>⌘K</kbd>
        </button>

        <button
          type="button" className="tb-btn" onClick={onOpenGuardians}
          aria-label={`Green Guardian tasks${openTasks ? `, ${openTasks} open` : ''}`}
          title="Green Guardian rapid dispatch"
          style={openTasks ? { color: 'var(--green-hi)', borderColor: 'rgba(52,211,153,.3)' } : undefined}
        >
          <Shield size={15} />
          <span className="hide-md">Guardians</span>
          {openTasks > 0 && <span className="count-badge" key={openTasks}>{openTasks}</span>}
        </button>

        {isStudent ? (
          <button type="button" className="tb-btn hide-sm" onClick={onOpenGamification} title="Daily quests & Eco-Wheel"
            style={{ color: 'var(--amber)', borderColor: 'rgba(251,191,36,.25)', background: 'rgba(251,191,36,.07)' }}>
            <Flame size={15} style={{ animation: 'breathe 2.4s ease-in-out infinite' }} />
            <span className="hide-md">5d streak</span>
          </button>
        ) : (
          <button type="button" className="tb-btn" onClick={onOpenActionMesh} title="Hermes autonomous dispatch mesh"
            style={{ color: 'var(--violet)', borderColor: 'rgba(192,132,252,.3)', background: 'rgba(192,132,252,.08)' }}>
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <Bot size={15} />
              <span style={{ position: 'absolute', top: -3, right: -4, width: 6, height: 6, borderRadius: 9, background: '#c084fc', boxShadow: '0 0 8px #c084fc', animation: 'breathe 1.6s infinite' }} />
            </span>
            <span className="hide-md">Hermes</span>
          </button>
        )}

        {isStudent && <WalletChip credits={userCredits} />}

        <UserMenu />
      </div>

      <div className="scroll-progress" style={{ '--p': progress }} aria-hidden="true" />

      <style>{`
        @media (min-width: 1024px) { .show-lt-lg { display: none !important; } }
        @media (max-width: 1200px) { .hide-md { display: none !important; } }
        @media (max-width: 560px)  { .hide-sm { display: none !important; } }
      `}</style>
    </header>
  );
}
