import { useMemo, useState, useEffect } from 'react';
import {
  Flame, BookOpen, Award, Brain, AlertCircle, TrendingUp,
  Star, Target, CheckCircle2, Lock, Trophy,
  BarChart3, Calendar, Sparkles,
} from 'lucide-react';
import type { ActivityLog, Vocab } from '@/lib/types';

interface StatsTabProps {
  vocab: Vocab[];
  streak: number;
  totalReviews: number;
  activity: ActivityLog[];
}

const DAILY_GOAL = 20; // reviews/additions per day target

/* ── XP / Level system ── */
function getLevel(xp: number) {
  const levels = [
    { min: 0,    max: 49,   label: 'Mầm non',  color: '#94a3b8', emoji: '🌱' },
    { min: 50,   max: 199,  label: 'Học sinh',  color: '#60a5fa', emoji: '📚' },
    { min: 200,  max: 499,  label: 'Sinh viên', color: '#818cf8', emoji: '🎓' },
    { min: 500,  max: 999,  label: 'Cử nhân',   color: '#a78bfa', emoji: '🏆' },
    { min: 1000, max: 1999, label: 'Thạc sĩ',   color: '#f59e0b', emoji: '💎' },
    { min: 2000, max: Infinity, label: 'Tiến sĩ', color: '#f97316', emoji: '👑' },
  ];
  return levels.find((l) => xp >= l.min && xp <= l.max) ?? levels[0];
}

/* ── Badges ── */
interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  unlocked: boolean;
  category: 'vocab' | 'streak' | 'mastery';
}

function getBadges(vocab: Vocab[], streak: number, totalReviews: number): Badge[] {
  const total = vocab.length;
  const mastered = vocab.filter((v) => v.memory_bucket === 'flashcard').length;
  return [
    { id: 'first',    emoji: '🌱', label: 'Mầm non',       desc: 'Thêm từ đầu tiên',        unlocked: total >= 1,   category: 'vocab' },
    { id: 'ten',      emoji: '📚', label: 'Học sinh',       desc: '10 từ vựng',               unlocked: total >= 10,  category: 'vocab' },
    { id: 'fifty',    emoji: '🎓', label: 'Sinh viên',      desc: '50 từ vựng',               unlocked: total >= 50,  category: 'vocab' },
    { id: 'hundred',  emoji: '🏆', label: 'Chuyên gia',     desc: '100 từ vựng',              unlocked: total >= 100, category: 'vocab' },
    { id: 'twohund',  emoji: '💎', label: 'Bậc thầy',       desc: '200 từ vựng',              unlocked: total >= 200, category: 'vocab' },
    { id: 'streak7',  emoji: '🔥', label: 'Cháy rực',       desc: 'Streak 7 ngày',            unlocked: streak >= 7,  category: 'streak' },
    { id: 'streak30', emoji: '⚡', label: 'Siêu tốc',       desc: 'Streak 30 ngày',           unlocked: streak >= 30, category: 'streak' },
    { id: 'rev50',    emoji: '🧐', label: 'Chăm chỉ',       desc: '50 lần ôn tập',            unlocked: totalReviews >= 50, category: 'streak' },
    { id: 'rev200',   emoji: '🚀', label: 'Không ngừng',    desc: '200 lần ôn tập',           unlocked: totalReviews >= 200, category: 'streak' },
    { id: 'master20', emoji: '✅', label: 'Đã nhớ nhiều',   desc: '20 từ đã nhớ vững',        unlocked: mastered >= 20,  category: 'mastery' },
    { id: 'master50', emoji: '🧠', label: 'Não bộ',         desc: '50 từ đã nhớ vững',        unlocked: mastered >= 50,  category: 'mastery' },
    { id: 'master100',emoji: '👑', label: 'Không thể dừng', desc: '100 từ đã nhớ vững',       unlocked: mastered >= 100, category: 'mastery' },
  ];
}

/* ── Progress ring SVG ── */
function ProgressRing({
  pct, size = 120, stroke = 10, color = '#6366f1', bg = '#e2e8f0',
  children,
}: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Heatmap cell color ── */
function heatColor(count: number) {
  if (count === 0) return '#f1f5f9';
  if (count < 5)  return '#c7d2fe';
  if (count < 10) return '#818cf8';
  if (count < 20) return '#6366f1';
  return '#4338ca';
}

export function StatsTab({ vocab, streak, totalReviews, activity }: StatsTabProps) {
  const [goalCelebrated, setGoalCelebrated] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* ── Derived stats ── */
  const flashcardCount   = vocab.filter((v) => v.memory_bucket === 'flashcard').length;
  const unrememberedCount = vocab.filter((v) => v.memory_bucket === 'unremembered').length;
  const temporaryCount   = vocab.filter((v) => v.memory_bucket === 'temporary').length;
  const totalDist = Math.max(1, vocab.length);

  const xp = totalReviews * 10 + vocab.length * 5;
  const level = getLevel(xp);
  const nextLevel = getLevel(xp + 1);

  /* ── Today's activity ── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = activity.find((a) => a.date === todayStr);
  const todayActivity = (todayLog?.reviewed ?? 0) + (todayLog?.added ?? 0);
  const goalPct = Math.min((todayActivity / DAILY_GOAL) * 100, 100);
  const goalDone = goalPct >= 100;

  useEffect(() => {
    if (goalDone && !goalCelebrated) setGoalCelebrated(true);
  }, [goalDone, goalCelebrated]);

  /* ── 30-day heatmap ── */
  const heatmap = useMemo(() => {
    const days: { date: string; count: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const log = activity.find((a) => a.date === dateStr);
      days.push({
        date: dateStr,
        count: (log?.reviewed ?? 0) + (log?.added ?? 0),
        label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      });
    }
    return days;
  }, [activity]);

  /* ── 7-day bar chart ── */
  const last7 = useMemo(() => {
    const days: { date: string; label: string; reviewed: number; added: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
      const log = activity.find((a) => a.date === dateStr);
      days.push({ date: dateStr, label, reviewed: log?.reviewed ?? 0, added: log?.added ?? 0 });
    }
    return days;
  }, [activity]);
  const maxActivity = Math.max(1, ...last7.map((d) => d.reviewed + d.added));

  /* ── Badges ── */
  const badges = getBadges(vocab, streak, totalReviews);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const nextBadge = badges.find((b) => !b.unlocked);

  const cardStyle = (delay = 0) => ({
    opacity: animIn ? 1 : 0,
    transform: animIn ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
  });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 space-y-5 pb-10">

      {/* ═══ HERO ═══ */}
      <div style={cardStyle(0)}
        className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-2xl shadow-indigo-300/40 relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Left: streak + level */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">{level.emoji}</span>
              <div>
                <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Cấp độ hiện tại</div>
                <div className="text-xl font-black tracking-tight">{level.label}</div>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <Flame className="w-7 h-7 text-orange-300 animate-flame shrink-0" />
              <span className="text-5xl font-black">{streak}</span>
              <span className="text-xl text-indigo-200">ngày streak</span>
            </div>
            <p className="text-indigo-200 text-sm">
              Tổng <span className="font-bold text-white">{totalReviews}</span> lần ôn tập •{' '}
              <span className="font-bold text-white">{vocab.length}</span> từ trong kho
            </p>
          </div>

          {/* Right: XP ring */}
          <div className="flex flex-col items-center gap-2">
            <ProgressRing pct={Math.min((xp % 1000) / 10, 100)} size={110} stroke={9} color="#fbbf24" bg="rgba(255,255,255,0.15)">
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-300">{xp}</div>
                <div className="text-[10px] text-indigo-200 uppercase font-semibold">XP</div>
              </div>
            </ProgressRing>
            <div className="text-xs text-indigo-200">
              {nextLevel.label !== level.label ? `→ ${nextLevel.label}` : '🏆 MAX LEVEL'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TODAY GOAL + QUICK STATS ═══ */}
      <div style={cardStyle(80)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Daily Goal Ring */}
        <div className={`sm:col-span-1 rounded-2xl p-5 border-2 flex flex-col items-center gap-3 relative overflow-hidden transition-all ${
          goalDone
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg shadow-emerald-100'
            : 'bg-white border-slate-200'
        }`}>
          {goalDone && (
            <div className="absolute top-2 right-2">
              <span className="text-lg animate-bounce inline-block">🎉</span>
            </div>
          )}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Mục tiêu hôm nay
          </div>
          <ProgressRing
            pct={goalPct}
            size={100} stroke={9}
            color={goalDone ? '#10b981' : '#6366f1'}
            bg={goalDone ? '#d1fae5' : '#e2e8f0'}
          >
            <div className="text-center">
              <div className={`text-2xl font-black ${goalDone ? 'text-emerald-600' : 'text-slate-800'}`}>
                {todayActivity}
              </div>
              <div className="text-[9px] text-slate-400 font-medium uppercase">/{DAILY_GOAL}</div>
            </div>
          </ProgressRing>
          <div className={`text-sm font-semibold text-center ${goalDone ? 'text-emerald-600' : 'text-slate-600'}`}>
            {goalDone ? '✅ Hoàn thành mục tiêu!' : `Còn ${Math.max(0, DAILY_GOAL - todayActivity)} hoạt động`}
          </div>
        </div>

        {/* Quick stat cards */}
        <div className="sm:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: 'Tổng từ', value: vocab.length, icon: BookOpen, grad: 'from-indigo-500 to-blue-500', sub: 'trong kho từ' },
            { label: 'Đã nhớ vững', value: flashcardCount, icon: Award, grad: 'from-emerald-500 to-teal-500', sub: `${Math.round(flashcardCount / totalDist * 100)}% tổng số` },
            { label: 'Tạm nhớ', value: temporaryCount, icon: Brain, grad: 'from-amber-500 to-orange-500', sub: 'đang học' },
            { label: 'Chưa nhớ', value: unrememberedCount, icon: AlertCircle, grad: 'from-rose-500 to-pink-500', sub: 'cần ôn lại' },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.grad} flex items-center justify-center mb-2.5 shadow-sm`}>
                  <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                </div>
                <p className="text-2xl font-black text-slate-900 leading-none">{m.value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{m.sub}</p>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ VOCABULARY HEALTH ═══ */}
      <div style={cardStyle(140)} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Sức khoẻ từ vựng</h3>
        </div>
        <div className="space-y-3.5">
          {[
            { label: '✅ Đã nhớ vững', count: flashcardCount, color: 'bg-gradient-to-r from-emerald-400 to-teal-500', textColor: 'text-emerald-700' },
            { label: '🧠 Tạm nhớ', count: temporaryCount, color: 'bg-gradient-to-r from-amber-400 to-orange-400', textColor: 'text-amber-700' },
            { label: '📖 Chưa nhớ', count: unrememberedCount, color: 'bg-gradient-to-r from-rose-400 to-pink-500', textColor: 'text-rose-700' },
          ].map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600 font-medium">{d.label}</span>
                <span className={`font-bold text-sm ${d.textColor}`}>{d.count} <span className="text-slate-400 font-normal text-xs">({Math.round(d.count / totalDist * 100)}%)</span></span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${d.color} rounded-full transition-all duration-700 shadow-sm`}
                  style={{ width: animIn ? `${(d.count / totalDist) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 30-DAY HEATMAP ═══ */}
      <div style={cardStyle(200)} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Bản đồ hoạt động 30 ngày</h3>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {heatmap.map((d, i) => (
            <div
              key={d.date}
              title={`${d.label}: ${d.count} hoạt động`}
              className="rounded-md aspect-square cursor-default transition-transform hover:scale-110"
              style={{
                backgroundColor: heatColor(d.count),
                opacity: animIn ? 1 : 0,
                transform: animIn ? 'scale(1)' : 'scale(0.5)',
                transition: `opacity 0.3s ease ${i * 18}ms, transform 0.3s ease ${i * 18}ms, background-color 0.3s`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
          <span>Ít</span>
          {[0, 3, 8, 15, 25].map((n) => (
            <div key={n} className="w-3 h-3 rounded-sm" style={{ backgroundColor: heatColor(n) }} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      {/* ═══ 7-DAY BAR CHART ═══ */}
      <div style={cardStyle(260)} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Hoạt động 7 ngày gần đây</h3>
        </div>
        <div className="flex items-end justify-between gap-1.5 h-36">
          {last7.map((d, i) => {
            const total = d.reviewed + d.added;
            const h = (total / maxActivity) * 100;
            const isToday = d.date === todayStr;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-400 font-medium h-4 flex items-center">
                  {total > 0 ? total : ''}
                </div>
                <div className="w-full flex-1 flex items-end relative group">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded px-1.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Ôn: {d.reviewed} | Thêm: {d.added}
                  </div>
                  <div
                    className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-700"
                    style={{ height: animIn ? `${Math.max(h, 4)}%` : '4%' }}
                  >
                    {d.added > 0 && (
                      <div className="bg-emerald-400" style={{ height: `${d.reviewed > 0 ? (d.added / total) * 100 : 100}%` }} />
                    )}
                    {d.reviewed > 0 && (
                      <div className={`${isToday ? 'bg-indigo-600' : 'bg-indigo-400'}`}
                        style={{ height: `${(d.reviewed / total) * 100}%` }} />
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                  {isToday ? '•' : d.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" /> Ôn tập</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400" /> Thêm mới</span>
        </div>
      </div>

      {/* ═══ ACHIEVEMENT BADGES ═══ */}
      <div style={cardStyle(320)} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Thành tích</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {unlockedBadges.length}/{badges.length} mở khóa
          </span>
        </div>

        {/* Next badge hint */}
        {nextBadge && (
          <div className="mb-4 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <div className="text-2xl grayscale opacity-50">{nextBadge.emoji}</div>
            <div>
              <div className="text-xs text-indigo-600 font-bold">Huy hiệu tiếp theo: {nextBadge.label}</div>
              <div className="text-xs text-indigo-400">{nextBadge.desc}</div>
            </div>
            <div className="ml-auto">
              <Lock className="w-4 h-4 text-indigo-300" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {badges.map((badge, i) => (
            <div
              key={badge.id}
              title={`${badge.label}: ${badge.desc}`}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-default ${
                badge.unlocked
                  ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md shadow-amber-100'
                  : 'border-slate-200 bg-slate-50 opacity-40'
              }`}
              style={badge.unlocked ? {
                animation: animIn ? `badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both` : 'none',
              } : {}}
            >
              {badge.unlocked && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-[9px] font-bold text-slate-700 text-center leading-tight">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MOTIVATIONAL FOOTER ═══ */}
      <div style={cardStyle(380)} className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
          <Trophy className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">
            {streak >= 7 ? '🔥 Chuỗi ấn tượng! Tiếp tục phá kỷ lục!' :
             streak >= 3 ? '⚡ Đang có momentum! Đừng bỏ lỡ ngày hôm nay.' :
             'Mỗi ngày học một chút — tiến bộ không thể đo lường.'}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {unrememberedCount > 0
              ? `Còn ${unrememberedCount} từ chưa nhớ — hãy ôn lại trước khi chúng "trốn thoát"!`
              : `Kho từ của bạn đang rất khoẻ mạnh 💪 Hãy thêm từ mới.`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {[...Array(Math.min(streak, 7))].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
      </div>

    </div>
  );
}
