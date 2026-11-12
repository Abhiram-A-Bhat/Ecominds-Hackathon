import React, { useLayoutEffect, useRef, useState } from 'react';
import { CaretDoubleRightIcon as ChevronsRight } from '@phosphor-icons/react/dist/csr/CaretDoubleRight';
import { CheckIcon as Check } from '@phosphor-icons/react/dist/csr/Check';

/**
 * Ride-hailing style "slide to accept". The thumb must be dragged ≥ 88% of the
 * track to fire; anything less springs back. Keyboard: arrows move the thumb,
 * Enter accepts (so screen-reader and keyboard users are not locked out).
 */
export function SlideToAccept({ onAccept, label = 'Slide to accept', accent = '#34d399', disabled = false, height = 64 }) {
  const trackRef = useRef(null);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const start = useRef({ px: 0, x: 0 });
  const xRef = useRef(0);
  const maxRef = useRef(0);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => { const m = Math.max(0, el.clientWidth - height); maxRef.current = m; setMax(m); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const finish = () => {
    moveTo(maxRef.current);
    setDone(true);
    onAccept?.();
  };

  const moveTo = (v) => { xRef.current = v; setX(v); };

  // Track the drag on window so a fast flick that leaves the thumb still counts
  const onDown = (e) => {
    if (disabled || done) return;
    e.preventDefault();
    start.current = { px: e.clientX, x: xRef.current };
    setDragging(true);
    const move = (ev) => {
      const nx = Math.min(maxRef.current, Math.max(0, start.current.x + ev.clientX - start.current.px));
      moveTo(nx);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      setDragging(false);
      if (xRef.current >= maxRef.current * 0.88) finish();
      else moveTo(0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const onKey = (e) => {
    if (disabled || done) return;
    if (e.key === 'Enter' || e.key === 'End') { e.preventDefault(); finish(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); const nx = Math.min(max, xRef.current + max * 0.25); if (nx >= max * 0.88) finish(); else moveTo(nx); }
    else if (e.key === 'ArrowLeft' || e.key === 'Home') { e.preventDefault(); moveTo(0); }
  };

  const p = max ? x / max : 0;
  const ease = dragging ? 'none' : 'transform .45s var(--ease-spring), width .45s var(--ease-spring)';

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative', height, borderRadius: height, overflow: 'hidden', userSelect: 'none', touchAction: 'none',
        background: 'rgba(255,255,255,.05)', border: `1px solid ${accent}55`,
        boxShadow: `inset 0 0 24px -8px ${accent}66`, opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* fill */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, width: x + height, borderRadius: height,
        background: `linear-gradient(90deg, ${accent}22, ${accent}88)`, transition: ease,
      }} />
      {/* label */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', paddingLeft: height * 0.6,
        fontSize: 15, fontWeight: 900, letterSpacing: '.02em', color: done ? '#022c1c' : 'var(--text)',
        opacity: done ? 1 : 1 - p * 1.3,
      }}>
        <span className={done ? '' : 'slide-shine'} style={{ '--accent': accent }}>
          {done ? 'Accepted!' : label}
        </span>
      </div>
      {/* thumb */}
      <button
        type="button"
        role="slider"
        aria-label={`${label}. Drag right or press Enter.`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}
        disabled={disabled}
        onPointerDown={onDown}
        onKeyDown={onKey}
        style={{
          position: 'absolute', top: 4, left: 4, width: height - 8, height: height - 8, borderRadius: height,
          border: 0, cursor: disabled ? 'not-allowed' : dragging ? 'grabbing' : 'grab',
          display: 'grid', placeItems: 'center', color: '#022c1c',
          background: `linear-gradient(135deg, #ecfccb, ${accent})`,
          boxShadow: `0 6px 22px -4px ${accent}, 0 0 0 4px ${accent}22`,
          transform: `translateX(${x}px)`, transition: ease,
          animation: done || dragging ? 'none' : 'nudge 1.6s var(--ease-out) infinite',
        }}
      >
        {done ? <Check size={24} strokeWidth={3} /> : <ChevronsRight size={26} strokeWidth={2.6} />}
      </button>
    </div>
  );
}
