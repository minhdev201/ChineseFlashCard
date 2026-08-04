import { ArrowLeftRight, BookOpenCheck, Sparkles, Trash2, Volume2, CheckCheck } from 'lucide-react';
import type { MemoryBucket, Vocab } from '@/lib/types';
import {
  memoryBucketColor,
  memoryBucketDescription,
  memoryBucketLabel,
} from '@/lib/srs';
import { speak } from '@/lib/speech';

interface MemoryBucketTabProps {
  bucket: Exclude<MemoryBucket, 'flashcard'>;
  vocab: Vocab[];
  onMove: (id: string, bucket: MemoryBucket) => Promise<void>;
  onStartFocusReview: (bucket: MemoryBucket) => void;
}

export function MemoryBucketTab({
  bucket,
  vocab,
  onMove,
  onStartFocusReview,
}: MemoryBucketTabProps) {
  const words = vocab.filter((item) => item.memory_bucket === bucket);
  const isUnremembered = bucket === 'unremembered';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 sm:p-8 text-white mb-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${memoryBucketColor(bucket)} mb-3`}
            >
              {isUnremembered ? '📌' : '🌤️'} {memoryBucketLabel(bucket)}
            </span>
            <h2 className="text-3xl font-bold">{words.length} từ</h2>
            <p className="text-slate-200 text-sm mt-2">{memoryBucketDescription(bucket)}</p>
          </div>
          <button
            onClick={() => onStartFocusReview(bucket)}
            disabled={words.length === 0}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpenCheck className="w-5 h-5" />
            Ôn tập chuyên sâu
          </button>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="text-center py-14 rounded-3xl bg-white border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {memoryBucketLabel(bucket)} đang trống
          </h3>
          <p className="text-sm text-slate-500">
            Bạn có thể đánh dấu từ ngay trong tab Flashcard để đưa chúng vào danh sách này.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <div
              key={word.id}
              className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => speak(word.hanzi)}
                  className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0"
                  title="Phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className="text-2xl font-bold text-slate-900"
                      style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
                    >
                      {word.hanzi}
                    </span>
                    <span className="text-sm font-medium text-indigo-500">{word.pinyin}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${memoryBucketColor(word.memory_bucket)}`}
                    >
                      {memoryBucketLabel(word.memory_bucket)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1">{word.meaning}</p>
                  {word.hanviet && <p className="text-xs text-slate-500">Âm Hán Việt: {word.hanviet}</p>}
                  {word.example && <p className="text-xs text-slate-400 mt-2 italic">{word.example}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => onMove(word.id, 'flashcard')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
                  title="Đánh dấu đã nhớ hết và đưa từ ra khỏi danh sách ôn tập"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đã nhớ
                </button>

                {isUnremembered ? (
                  <button
                    onClick={() => onMove(word.id, 'temporary')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Chuyển sang Tạm nhớ
                  </button>
                ) : (
                  <button
                    onClick={() => onMove(word.id, 'unremembered')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold hover:bg-rose-100 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Chuyển về Chưa nhớ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
