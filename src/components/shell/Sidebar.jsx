import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CaretDownIcon as ChevronDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { SidebarSimpleIcon as PanelLeftClose, SidebarSimpleIcon as PanelLeftOpen } from '@phosphor-icons/react/dist/csr/SidebarSimple';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../contexts/AuthContext';
import { getNavGroups } from '../../config/navigation';
import { BrandMark } from './BrandMark';

const LS_KEY = 'ecosphere_sb_groups';
const readClosed = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } };

export function NavList({ role, path, collapsed = false, onNavigate }) {
  const groups = getNavGroups(role);
  const [closed, setClosed] = useState(readClosed);
  const scrollRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, accent: '#34d399', visible: false });

  const toggle = (label) => setClosed(prev => {
    const next = { ...prev, [label]: !prev[label] };
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  });

  // Keep the sliding pill under the active link (re-measured whenever layout shifts)
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector(`[data-path="${CSS.escape(path)}"]`);
      const groupOpen = el && el.closest('.collapsible:not(.closed)');
      if (!el || (!groupOpen && !collapsed)) { setIndicator(i => ({ ...i, visible: false })); return; }
      setIndicator({ top: el.offsetTop, height: el.offsetHeight, accent: el.dataset.accent, visible: true });
    };
    measure();
    // Group expand/collapse animates grid rows, and web fonts can shift layout
    // after first paint, so re-measure on those too.
    const ro = new ResizeObserver(measure);
    ro.observe(root.firstElementChild || root);
    root.addEventListener('transitionend', measure);
    root.addEventListener('animationend', measure);
    document.fonts?.ready.then(measure);
    const t = setTimeout(measure, 400);
    return () => {
      ro.disconnect();
      root.removeEventListener('transitionend', measure);
      root.removeEventListener('animationend', measure);
      clearTimeout(t);
    };
  }, [path, collapsed, closed]);

  // Auto-open the group containing the active page
  useEffect(() => {
    const g = groups.find(g => g.items.some(i => i.path === path));
    if (g && closed[g.label]) setClosed(prev => ({ ...prev, [g.label]: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return (
    <nav className="sb-scroll" ref={scrollRef} aria-label="Main navigation">
      <div>
        <div
          className="sb-indicator"
          aria-hidden="true"
          style={{
            transform: `translateY(${indicator.top}px)`,
            height: indicator.height,
            opacity: indicator.visible ? 1 : 0,
            '--accent': indicator.accent,
            top: 0,
          }}
        />
        {groups.map((group, gi) => {
          const isClosed = !collapsed && closed[group.label];
          return (
            <div key={group.label} style={{ animation: `revealLeft .5s var(--ease-out) ${0.05 + gi * 0.06}s backwards` }}>
              <button
                type="button"
                className="sb-group-label"
                aria-expanded={!isClosed}
                onClick={() => !collapsed && toggle(group.label)}
                tabIndex={collapsed ? -1 : 0}
              >
                <span>{group.label}</span>
                <ChevronDown size={13} />
              </button>
              <div className={`collapsible ${isClosed ? 'closed' : ''}`}>
                <div>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = path === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        data-path={item.path}
                        data-accent={item.accent}
                        className={`sb-link ${active ? 'active' : ''}`}
                        style={{ '--accent': item.accent }}
                        onClick={onNavigate}
                        tabIndex={isClosed ? -1 : 0}
                        aria-label={collapsed ? item.title : undefined}
                      >
                        <span className="sb-ico"><Icon size={16} strokeWidth={2.2} /></span>
                        <span className="sb-label">{item.title}</span>
                        {item.badge && <span className="sb-badge">{item.badge}</span>}
                        <span className="sb-tip" role="tooltip">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar({ collapsed, onToggle, bins = [] }) {
  const { path } = useRouter();
  const { currentUser, role, roleMeta, isStudent } = useAuth();
  const pulseTo = { STUDENT: '/bins', STAFF: '/cleaner-ops', ADMIN: '/admin' }[role];

  const healthy = bins.filter(b => b.fillLevel < 80).length;
  const health = bins.length ? healthy / bins.length : 1;
  const C = 2 * Math.PI * 15;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Sidebar">
      <Link to="/" className="sb-brand" aria-label="Ecominds home">
        <BrandMark size={36} />
        <div className="sb-label" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Ecominds
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.06em' }}>
            RNSIT · CAMPUS OS
          </div>
        </div>
      </Link>

      <NavList role={role} path={path} collapsed={collapsed} />

      {/* Live campus pulse */}
      <div style={{ padding: '0 12px 10px' }}>
        <Link
          to={pulseTo}
          className="spotlight"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
            padding: collapsed ? 8 : '10px 12px', borderRadius: 14,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'rgba(110,231,183,.04)', border: '1px solid var(--border)',
            transition: 'padding var(--dur-3) var(--ease-out)',
            '--pulse-status': health > 0.8 ? '#34d399' : health > 0.5 ? '#fbbf24' : '#f87171',
          }}
          title="Campus bin health"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(110,231,183,.12)" strokeWidth="3.5" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="var(--pulse-status)"
              strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - health)}
              style={{ transition: 'stroke-dashoffset 1s var(--ease-out), stroke .4s' }}
            />
          </svg>
          <div className="sb-label" style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} /> Campus pulse
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
              {healthy}/{bins.length} bins healthy
            </div>
          </div>
        </Link>
      </div>

      {/* User + collapse */}
      <div className={`sb-footer ${collapsed ? 'is-collapsed' : ''}`} style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexDirection: collapsed ? 'column' : 'row' }}>
        <Link to="/profile" className="sb-account" aria-label={`Open ${currentUser?.name || 'your'} profile`} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none', cursor: 'pointer' }} title="Open profile">
          <span style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 18,
            background: roleMeta?.tint,
            border: `1px solid ${roleMeta?.border}`,
          }}>{currentUser?.avatar || '🌱'}</span>
          <span className="sb-label" style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name}
            </span>
            <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: roleMeta?.accent, letterSpacing: '.02em' }}>
              {roleMeta?.title}{isStudent && currentUser?.usn ? ` · ${currentUser.usn}` : ''}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="tb-btn"
          style={{ height: 32, minWidth: 32, padding: 0, borderRadius: 9 }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>
    </aside>
  );
}
