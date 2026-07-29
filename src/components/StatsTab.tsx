import { useMemo } from 'react';
import { Flame, BookOpen, Award, Brain, AlertCircle, TrendingUp } from 'lucide-react';
import type { ActivityLog, Vocab } from '@/lib/types';

interface StatsTabProps {
  vocab: Vocab[];
  streak: number;
  totalReviews: number;
  activity: ActivityLog[];
}

export function StatsTab({ vocab, streak, totalReviews, activity }: StatsTabProps) {
  const mastered = vocab.filter((v) => v.srs_level >= 5).length;
  const learning = vocab.filter((v) => v.srs_level > 0 && v.srs_level < 5).length;
  const fresh = vocab.filter((v) => v.srs_level === 0).length;
  const difficult = vocab.filter((v) => v.lapses >= 2).length;

  // 7-day activity chart
  const last7 = useMemo(() => {
    const days: { date: string; label: string; reviewed: number; added: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
      const log = activity.find((a) => a.date === dateStr);
      days.push({
        date: dateStr,
        label,
        reviewed: log?.reviewed || 0,
        added: log?.added || 0,
      });
    }
    return days;
  }, [activity]);

  const maxActivity = Math.max(1, ...last7.map((d) => d.reviewed + d.added));

  // SRS distribution
  const dist = [
    { label: 'Mới', count: fresh, color: 'bg-slate-400' },
    { label: 'Đang học', count: learning, color: 'bg-amber-400' },
    { label: 'Đã thuộc', count: vocab.filter((v) => v.srs_level >= 3 && v.srs_level < 5).length, color: 'bg-blue-400' },
    { label: 'Ghi nhớ sâu', count: mastered, color: 'bg-emerald-400' },
  ];
  const totalDist = Math.max(1, vocab.length);

  const metrics = [
    {
      label: 'Tổng số từ',
      value: vocab.length,
      icon: BookOpen,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      label: 'Ghi nhớ sâu',
      value: mastered,
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Đang học',
      value: learning + fresh,
      icon: Brain,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Hay gặp khó',
      value: difficult,
      icon: AlertCircle,
      color: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Streak hero */}
      <div className="rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 p-6 text-white shadow-lg shadow-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-50 text-sm">Chuỗi ngày học</p>
            <div className="flex items-baseline gap-2 mt-1">
              <Flame className="w-8 h-8 animate-flame" />
              <span className="text-4xl font-bold">{streak}</span>
              <span className="text-lg text-orange-50">ngày</span>
            </div>
            <p className="text-orange-50 text-sm mt-1">
              Tổng {totalReviews} lần ôn tập
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* SRS distribution */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Phân bổ theo trạng thái ghi nhớ</h3>
        <div className="space-y-3">
          {dist.map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">{d.label}</span>
                <span className="font-semibold text-slate-800">{d.count}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${d.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(d.count / totalDist) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day activity */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Hoạt động 7 ngày gần đây</h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {last7.map((d, i) => {
            const h = ((d.reviewed + d.added) / maxActivity) * 100;
            const reviewedH = d.reviewed > 0 ? (d.reviewed / (d.reviewed + d.added || 1)) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-slate-500 font-medium">
                  {d.reviewed + d.added > 0 ? d.reviewed + d.added : ''}
                </div>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-500"
                    style={{ height: `${Math.max(h, 2)}%` }}
                  >
                    {d.added > 0 && (
                      <div className="bg-emerald-400" style={{ height: `${100 - reviewedH}%` }} />
                    )}
                    {d.reviewed > 0 && (
                      <div className="bg-indigo-500" style={{ height: `${reviewedH}%` }} />
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400">{d.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500" /> Đã ôn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400" /> Thêm mới
          </span>
        </div>
      </div>
    </div>
  );
}
