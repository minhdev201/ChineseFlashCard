/**
 * RewardEffects – pure visual dopamine layer for MemoryGame.
 * Only exports React components (hook is in useRewardEffects.ts).
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BurstData, ScorePopupData } from '@/lib/useRewardEffects';

interface Particle {
  id: number; x: number; y: number;
  vx: number; vy: number;
  color: string; size: number; life: number;
  shape: 'circle' | 'square' | 'star';
}


/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const PARTICLE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#f97316', '#14b8a6',
  '#a855f7', '#eab308',
];
const CONFETTI_COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#01aaa6',
  '#ffeaa7', '#fd79a8', '#a29bfe', '#55efc4',
];

/* ─────────────────────────────────────────────
   Canvas Particle Burst (per correct click)
───────────────────────────────────────────── */
function ParticleBurstCanvas({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  // Keep a ref so the animation closure always calls the *latest* onDone
  // without putting it in the effect deps (which would restart the animation).
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    particlesRef.current = Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 6;
      return {
        id: i,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 5 + Math.random() * 7,
        life: 1,
        shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
      };
    });

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let finished = false;

    function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const ia = a + Math.PI / 5;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        ctx.lineTo(cx + (r / 2) * Math.cos(ia), cy + (r / 2) * Math.sin(ia));
      }
      ctx.closePath();
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      particlesRef.current.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.28; p.vx *= 0.97;
        p.life -= 0.028;
        if (p.life <= 0) return;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill();
        } else if (p.shape === 'square') {
          ctx.translate(p.x, p.y); ctx.rotate(p.life * 8);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.translate(p.x, p.y); ctx.rotate(p.life * 6);
          drawStar(ctx, 0, 0, p.size / 2); ctx.fill();
        }
        ctx.restore();
      });

      if (alive > 0) {
        animRef.current = requestAnimationFrame(frame);
      } else if (!finished) {
        finished = true;
        cancelAnimationFrame(animRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // ensure blank before unmount
        onDoneRef.current(); // remove from DOM
      }
    }

    animRef.current = requestAnimationFrame(frame);

    return () => {
      finished = true;
      cancelAnimationFrame(animRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only on mount — x,y captured in initial particles above

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9998 }}
    />
  );
}


/* ─────────────────────────────────────────────
   Confetti Rain (game complete)
───────────────────────────────────────────── */
export function ConfettiRain({ duration = 4000 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Confetto = { x: number; y: number; w: number; h: number; color: string; angle: number; av: number; vx: number; vy: number };
    const pieces: Confetto[] = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 300,
      w: 8 + Math.random() * 10, h: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      angle: Math.random() * Math.PI * 2, av: (Math.random() - 0.5) * 0.2,
      vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 4,
    }));

    const start = performance.now();
    function frame(now: number) {
      const elapsed = now - start;
      const alpha = elapsed > duration - 700 ? Math.max(0, 1 - (elapsed - (duration - 700)) / 700) : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.angle += p.av;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < duration) animRef.current = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9997 }}
    />
  );
}

/* ─────────────────────────────────────────────
   Score Popup ("+N pts" float-up)
───────────────────────────────────────────── */
function ScorePopupItem({ data, onDone }: { data: ScorePopupData; onDone: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(data.id), 950);
    return () => clearTimeout(t);
  }, [data.id, onDone]);

  const isCombo = data.combo >= 3;
  return (
    <div
      style={{
        position: 'fixed', left: data.x, top: data.y,
        transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 9999,
        animation: 'scoreFloat 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      }}
    >
      <div style={{
        background: isCombo
          ? 'linear-gradient(135deg, #f97316, #eab308)'
          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff', fontWeight: 900,
        fontSize: isCombo ? '1.4rem' : '1.05rem',
        padding: isCombo ? '6px 14px' : '4px 10px',
        borderRadius: '999px',
        boxShadow: isCombo
          ? '0 0 20px rgba(249,115,22,0.6), 0 4px 12px rgba(0,0,0,0.2)'
          : '0 4px 12px rgba(99,102,241,0.4)',
        whiteSpace: 'nowrap', letterSpacing: '-0.01em',
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}>
        {isCombo ? `🔥 +${data.points} x${data.combo} COMBO!` : `+${data.points}`}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Combo Flash Banner (milestone center popup)
───────────────────────────────────────────── */
export function ComboFlashBanner({ combo, flashKey }: { combo: number; flashKey: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (flashKey === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 950);
    return () => clearTimeout(t);
  }, [flashKey]);

  if (!visible) return null;

  const messages: Record<number, string> = {
    3: '🔥 COMBO x3!', 5: '⚡ COMBO x5!!',
    7: '🌟 SUPER x7!!', 10: '💥 ULTRA x10!!!',
    15: '👑 LEGENDARY x15!!', 20: '🚀 GODLIKE x20!!!',
  };
  const milestone = [20, 15, 10, 7, 5, 3].find((m) => combo >= m) ?? 3;
  const label = messages[milestone] ?? `🔥 COMBO x${combo}!`;
  const big = combo >= 10;

  return createPortal(
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none', zIndex: 10000,
      animation: 'comboFlash 0.95s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #f97316, #eab308)',
        color: '#fff', fontWeight: 900,
        fontSize: big ? '2.6rem' : combo >= 5 ? '2rem' : '1.7rem',
        padding: big ? '14px 32px' : '10px 24px',
        borderRadius: '20px',
        boxShadow: '0 0 50px rgba(249,115,22,0.7), 0 0 100px rgba(234,179,8,0.3), 0 8px 28px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap', letterSpacing: '-0.02em',
        textShadow: '0 2px 8px rgba(0,0,0,0.35)',
      }}>
        {label}
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   Overlay portal (bursts + popups)
───────────────────────────────────────────── */
export function RewardOverlay({
  bursts, popups, onBurstDone, onPopupDone,
}: {
  bursts: BurstData[];
  popups: ScorePopupData[];
  onBurstDone: (id: number) => void;
  onPopupDone: (id: number) => void;
}) {
  return createPortal(
    <>
      {bursts.map((b) => (
        <ParticleBurstCanvas key={b.id} x={b.x} y={b.y} onDone={() => onBurstDone(b.id)} />
      ))}
      {popups.map((p) => (
        <ScorePopupItem key={p.id} data={p} onDone={onPopupDone} />
      ))}
    </>,
    document.body
  );
}
