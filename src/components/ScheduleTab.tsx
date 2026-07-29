import { CalendarClock, Rocket, CheckCircle2, Clock, Award } from 'lucide-react';
import type { Vocab } from '@/lib/types';
import { isDue, masteryColor, masteryLabel } from '@/lib/srs';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/speech';

interface ScheduleTabProps {
  vocab: Vocab[];
  onStartDue: () => void;
}

export function ScheduleTab({ vocab, onStartDue }: ScheduleTabProps) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const dueToday = vocab.filter((v) => v.next_review_at <= today);
  const dueTomorrow = vocab.filter((v) => v.next_review_at === tomorrow);
  const mastered = vocab.filter((v) => v.srs_level >= 5);

  const groups = [
    {
      title: 'Cần ôn hôm nay',
      icon: Clock,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      words: dueToday,
    },
    {
      title: 'Sắp đến hạn (Ngày mai)',
      icon: CalendarClock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      words: dueTomorrow,
    },
    {
      title: 'Đã ghi nhớ sâu (Dài hạn)',
      icon: Award,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      words: mastered,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 p-6 sm:p-8 text-white mb-6 shadow-lg shadow-indigo-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-100 text-sm mb-1">Hôm nay</p>
            <h2 className="text-3xl font-bold">
              {dueToday.length} từ cần ôn
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              {dueToday.length > 0
                ? 'Đã đến hạn ôn tập theo thuật toán SRS'
                : 'Bạn đã hoàn thành ôn tập hôm nay! 🎉'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <CalendarClock className="w-7 h-7" />
          </div>
        </div>
        {dueToday.length > 0 && (
          <button
            onClick={onStartDue}
            className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors shadow-md"
          >
            <Rocket className="w-5 h-5" />
            Bắt đầu ôn tập ngay
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.map((g) => {
        const Icon = g.icon;
        if (g.words.length === 0) return null;
        return (
          <div key={g.title} className="mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${g.color}`}>
                <Icon className="w-4 h-4" />
                {g.title}
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/70 text-xs">
                  {g.words.length}
                </span>
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {g.words.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => speak(w.hanzi)}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0"
                    title="Phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-lg font-bold text-slate-900 truncate"
                        style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
                      >
                        {w.hanzi}
                      </span>
                      <span className="text-sm text-indigo-500 truncate">{w.pinyin}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{w.meaning}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${masteryColor(w.srs_level)} shrink-0`}>
                    {masteryLabel(w.srs_level)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {vocab.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có từ nào trong bộ sưu tập.</p>
        </div>
      )}
    </div>
  );
}
