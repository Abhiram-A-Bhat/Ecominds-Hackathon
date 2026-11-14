import React, { useEffect } from 'react';
import { TrashIcon as Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { Link } from '../router/Router';
import { startAlarm, stopAlarm } from '../utils/alarmSound';

export function StaffBinAlarm({ alert, onDismiss, onOpen }) {
  useEffect(() => {
    if (alert) startAlarm();
    else stopAlarm();
    return () => stopAlarm();
  }, [alert?.key, alert]);

  if (!alert) return null;
  const level = Math.round(Number(alert.fillPercent) || 0);

  return (
    <div className="alarm-root staff-bin-alarm" role="alertdialog" aria-modal="true" aria-labelledby="staff-bin-alert-title" aria-describedby="staff-bin-alert-description">
      <div className="alarm-backdrop pulsing" />
      <section className="alarm-sheet" style={{ borderColor: 'rgba(36,140,82,.55)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ width: 48, height: 48, flex: '0 0 auto', display: 'grid', placeItems: 'center', borderRadius: 15, color: '#fff', background: 'var(--role)', boxShadow: 'var(--shadow-button)' }}>
            <Trash size={24} weight="fill" />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--role-hi)' }}>Collection needed</div>
            <h2 id="staff-bin-alert-title" style={{ margin: '5px 0 6px', fontSize: 21, lineHeight: 1.2, fontWeight: 900, textWrap: 'balance' }}>
              {alert.binName || `Bin ${alert.binId}`} is full
            </h2>
            <div id="staff-bin-alert-description" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--text-2)', fontSize: 13 }}>
              <MapPin size={15} style={{ marginTop: 2, flex: '0 0 auto' }} />
              <span>{alert.block || 'Campus'} · {level}% full · {alert.source === 'live' ? 'Live ESP32 sensor' : 'Mock bin network'}</span>
            </div>
          </div>
          <button type="button" className="tb-btn" onClick={onDismiss} aria-label="Dismiss bin alert" style={{ minWidth: 34, height: 34, padding: 0 }}>
            <X size={16} />
          </button>
        </div>
        <div className="bin-live-meter" style={{ margin: '20px 0 18px' }}>
          <div style={{ width: `${Math.max(0, Math.min(100, level))}%`, background: 'linear-gradient(90deg, var(--role-hi), var(--role))' }} />
        </div>
        <p style={{ margin: '0 0 18px', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.5 }}>
          Please clear the bin and confirm collection in Ground Ops.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn-ghost" onClick={onDismiss} style={{ padding: '10px 14px' }}>Dismiss</button>
          <Link to="/cleaner-ops" className="btn-eco" onClick={onOpen} style={{ padding: '10px 16px', color: '#fff', textDecoration: 'none' }}>
            Open collection route
          </Link>
        </div>
      </section>
    </div>
  );
}
