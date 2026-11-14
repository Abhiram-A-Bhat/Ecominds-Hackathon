import React, { useCallback, useEffect, useState } from 'react';
import { ChatTextIcon as ChatText } from '@phosphor-icons/react/dist/csr/ChatText';
import { CheckCircleIcon as CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ClockIcon as Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { useAuth } from '../contexts/AuthContext';
import { Link } from '../router/Router';
import { getStudentFeedback, setStudentFeedbackStatus, submitStudentFeedback } from '../services/studentFeedbackService';

const CATEGORIES = [
  'Facilities or maintenance',
  'Safety concern',
  'Waste or cleanliness',
  'Overseer conduct or negligence',
  'Staff or service concern',
  'Other',
];

const STATUS = {
  OPEN: { label: 'New', color: '#fbbf24' },
  IN_REVIEW: { label: 'In review', color: '#60a5fa' },
  RESOLVED: { label: 'Resolved', color: '#34d399' },
};

const panelStyle = { border: '1px solid var(--border)', background: 'var(--card)', borderRadius: 22, padding: 'clamp(18px, 3vw, 28px)', boxShadow: 'var(--shadow-card)' };
const fieldStyle = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 13px', background: 'var(--surface)', color: 'var(--text)', font: 'inherit', fontSize: 13 };

export function StudentFeedbackPage() {
  const { currentUser, isAdmin } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (signal) => {
    try {
      setFeedback(await getStudentFeedback(signal));
      setError('');
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const timer = window.setInterval(() => refresh(), 10000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [refresh, isAdmin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await submitStudentFeedback({ user: currentUser, category, message: message.trim(), location: location.trim(), anonymous });
      setMessage('');
      setLocation('');
      setAnonymous(false);
      setNotice('Your feedback has been sent to the admin team.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (item, status) => {
    try {
      const updated = await setStudentFeedbackStatus(item.id, status);
      setFeedback(items => items.map(existing => existing.id === updated.id ? updated : existing));
    } catch (err) {
      setError(err.message);
    }
  };

  const title = isAdmin ? 'Student Feedback Inbox' : 'Student Feedback';

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <header style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--role-hi)', fontSize: 12, fontWeight: 700 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Ecominds</Link><span>/</span><span style={{ color: 'var(--text-3)' }}>{title}</span>
        </div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px', color: 'var(--text)', fontSize: 26, fontWeight: 900 }}><ChatText size={26} />{title}</h1>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
          {isAdmin ? 'Review student concerns, including reports about Overseer conduct and missed responsibilities.' : 'Report a campus issue or concern to the admin team. You can choose to submit it anonymously.'}
        </p>
      </header>

      {notice && <div role="status" style={{ border: '1px solid rgba(52,217,150,.28)', borderRadius: 12, padding: 12, color: '#34d996', background: 'rgba(52,217,150,.08)', fontSize: 13 }}>{notice}</div>}
      {error && <div role="alert" style={{ border: '1px solid rgba(248,113,113,.3)', borderRadius: 12, padding: 12, color: '#fca5a5', background: 'rgba(248,113,113,.08)', fontSize: 13 }}>{error}</div>}

      {!isAdmin && (
        <form onSubmit={handleSubmit} style={{ ...panelStyle, display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 800 }}>
            What is this about?
            <select value={category} onChange={event => setCategory(event.target.value)} style={fieldStyle}>{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select>
          </label>
          <label style={{ display: 'grid', gap: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 800 }}>
            What happened?
            <textarea required minLength={10} maxLength={2000} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder="Describe the issue so the admin team can follow up." style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </label>
          <label style={{ display: 'grid', gap: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 800 }}>
            Location (optional)
            <input maxLength={160} value={location} onChange={event => setLocation(event.target.value)} placeholder="Building, floor, or campus area" style={fieldStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>
            <input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} style={{ marginTop: 3, accentColor: 'var(--role)' }} />
            Submit anonymously. Your name and USN will be hidden from the admin inbox.
          </label>
          <div><button type="submit" className="btn-eco" disabled={busy || message.trim().length < 10} aria-busy={busy} style={{ padding: '10px 18px', opacity: busy || message.trim().length < 10 ? .55 : 1 }}>{busy ? 'Sending…' : 'Send to admin'}</button></div>
        </form>
      )}

      <section style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 18, fontWeight: 900 }}>{isAdmin ? 'Incoming reports' : 'Your reports'}</h2>
          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{feedback.length} total</span>
        </div>
        {feedback.length === 0 ? (
          <div style={{ ...panelStyle, color: 'var(--text-3)', fontSize: 13 }}>{isAdmin ? 'No student feedback has been submitted yet.' : 'You have not submitted any feedback yet.'}</div>
        ) : feedback.map(item => {
          const status = STATUS[item.status] || STATUS.OPEN;
          return (
            <article key={item.id} style={{ ...panelStyle, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--text)', fontSize: 14 }}>{item.category}</strong>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: status.color, fontSize: 11, fontWeight: 800 }}>{item.status === 'RESOLVED' ? <CheckCircle size={13} /> : <Clock size={13} />}{status.label}</span>
                  </div>
                  <div style={{ marginTop: 5, color: 'var(--text-3)', fontSize: 11 }}>{item.id} · {new Date(item.createdAt).toLocaleString()}{isAdmin ? ` · ${item.reporterName}${item.reporterUsn ? ` (${item.reporterUsn})` : ''}` : ''}</div>
                </div>
                {isAdmin && item.status !== 'RESOLVED' && <button type="button" className="btn-ghost" onClick={() => updateStatus(item, item.status === 'OPEN' ? 'IN_REVIEW' : 'RESOLVED')} style={{ padding: '8px 12px', fontSize: 11 }}>{item.status === 'OPEN' ? 'Start review' : 'Mark resolved'}</button>}
              </div>
              <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.message}</p>
              {item.location && <div style={{ color: 'var(--text-3)', fontSize: 12 }}>Location: {item.location}</div>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
