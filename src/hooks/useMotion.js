import { useEffect, useRef, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Global cursor spotlight: any element with class "spotlight" gets --mx/--my
 * set relative to the pointer, which drives the radial glow in index.css.
 * One listener for the whole app instead of one per card.
 */
export function useGlobalSpotlight() {
  useEffect(() => {
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = e.target?.closest?.('.spotlight');
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, []);
}

/** 3D tilt that follows the pointer. Returns props to spread on the element. */
export function useTilt(max = 7) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const move = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
      });
    };
    const leave = () => { cancelAnimationFrame(frame); el.style.transform = ''; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(frame); };
  }, [max]);
  return ref;
}

/** Smoothly tweens a displayed number toward `value`. */
export function useTweenedNumber(value, duration = 900) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion()) { setDisplay(value); fromRef.current = value; return; }
    const from = fromRef.current;
    if (from === value) return;
    let start = 0, raf = 0;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = Math.round(from + (value - from) * eased);
      setDisplay(v);
      fromRef.current = v;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

/** Reveal-on-scroll: returns [ref, visible]. Fires once. */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [options.threshold, options.rootMargin]);
  return [ref, visible];
}

/** Window scroll position flags for the shell. */
export function useScrollState(threshold = 8) {
  const [state, setState] = useState({ scrolled: false, progress: 0, y: 0 });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setState({ scrolled: y > threshold, progress: max > 0 ? Math.min(y / max, 1) : 0, y });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [threshold]);
  return state;
}

/**
 * Auto scroll-reveal for feature pages that predate the design system.
 * Cards nested in grids/stacks below the fold fade + rise in as they scroll
 * into view. Uses the independent `translate` property so it never fights
 * a component's own inline `transform`, and cleans up after itself.
 */
export function useAutoReveal(containerRef, key) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    if (root.querySelector('[data-own-motion]')) return; // page choreographs itself
    let io;
    const timer = setTimeout(() => {
      const vh = window.innerHeight;
      const candidates = root.querySelectorAll(':scope > * > * > *, :scope > * > * > * > *');
      const targets = [];
      candidates.forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'absolute' || cs.display === 'inline' || cs.display === 'contents') return;
        const r = el.getBoundingClientRect();
        if (r.height < 40 || r.top < vh * 0.9) return;           // already visible or too small
        if (el.parentElement?.classList.contains('auto-reveal')) return; // parent animates it
        el.classList.add('auto-reveal');
        targets.push(el);
      });
      io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // stagger siblings that enter together
          const sibs = [...el.parentElement.children].filter(c => c.classList.contains('auto-reveal') && !c.classList.contains('in'));
          el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 60}ms`;
          el.classList.add('in');
          io.unobserve(el);
          setTimeout(() => { el.classList.remove('auto-reveal', 'in'); el.style.transitionDelay = ''; }, 1100);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      targets.forEach(t => io.observe(t));
    }, 120);
    return () => { clearTimeout(timer); io?.disconnect(); };
  }, [containerRef, key]);
}
