import React, { useEffect } from 'react';
import { SquaresFourIcon as LayoutGrid } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { SignOutIcon as LogOut } from '@phosphor-icons/react/dist/csr/SignOut';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../contexts/AuthContext';
import { MOBILE_TABS, getRoute } from '../../config/navigation';
import { NavList } from './Sidebar';
import { BrandMark } from './BrandMark';

export function MobileTabBar({ onOpenDrawer }) {
  const { path } = useRouter();
  const { role } = useAuth();
  const tabs = MOBILE_TABS[role].map(p => getRoute(p, role));
  const activeIdx = tabs.findIndex(t => t.path === path);
  const idx = activeIdx === -1 ? 4 : activeIdx;

  return (
    <nav className="mobile-bar" aria-label="Quick navigation">
      <span
        className="mb-blob"
        aria-hidden="true"
        style={{ left: 6, width: 'calc((100% - 12px) / 5)', transform: `translateX(${idx * 100}%)` }}
      />
      {tabs.map(t => {
        const Icon = t.icon;
        return (
          <Link key={t.path} to={t.path} className={`mb-item ${path === t.path ? 'active' : ''}`}>
            <Icon size={19} strokeWidth={2.2} />
            <span>{t.short}</span>
          </Link>
        );
      })}
      <button type="button" className={`mb-item ${activeIdx === -1 ? 'active' : ''}`} onClick={onOpenDrawer} aria-label="All modules">
        <LayoutGrid size={19} strokeWidth={2.2} />
        <span>More</span>
      </button>
    </nav>
  );
}

export function MobileDrawer({ open, onClose }) {
  const { path } = useRouter();
  const { role, roleMeta, currentUser, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Navigation">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
          <BrandMark size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Ecominds</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>{currentUser?.name} · <span style={{ color: roleMeta?.accent }}>{roleMeta?.title}</span></div>
          </div>
          <button type="button" className="tb-btn" onClick={onClose} aria-label="Close menu" style={{ padding: 0 }}>
            <X size={18} />
          </button>
        </div>
        <NavList role={role} path={path} onNavigate={onClose} />
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button type="button" className="menu-item danger" onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
