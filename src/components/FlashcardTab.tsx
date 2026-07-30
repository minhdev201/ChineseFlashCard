import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Shuffle,
  Volume2,
  VolumeX,
  Check,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpenCheck,
  Pin,
  SunMedium,
  Layers3,
} from 'lucide-react';
import type { FlashcardSource, MemoryBucket, Vocab } from '@/lib/types';
import { memoryBucketColor, memoryBucketLabel } from '@/lib/srs';
import { pinyinMatches, normalizePinyinInput } from '@/lib/pinyin';
import { playTing, speak } from '@/lib/speech';

interface FlashcardTabProps {
  vocab: Vocab[];
  activeSource: FlashcardSource;
  onSetMemoryBucket: (id: string, bucket: MemoryBucket) => Promise<void>;
  onShowAllFlashcards: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MEMORY_ACTIONS: {
  bucket: Exclude<MemoryBucket, 'flashcard'>;
  label: string;
  savedLabel: string;
  hint: string;
  icon: typeof Pin;
  classes: string;
  savedClasses: string;
}[] = [
  {
    bucket: 'unremembered',
    label: 'Chưa nhớ',
    savedLabel: 'Đã lưu chưa nhớ',
    hint: 'Ôn gắt gao',
    icon: Pin,
    classes: 'bg-rose-500 hover:bg-rose-600 text-white',
    savedClasses: 'bg-rose-700 text-white ring-2 ring-rose-300 shadow-inner',
  },
  {
    bucket: 'temporary',
    label: 'Tạm nhớ',
    savedLabel: 'Đã lưu tạm nhớ',
    hint: 'Đang củng cố',
    icon: SunMedium,
    classes: 'bg-amber-500 hover:bg-amber-600 text-white',
    savedClasses: 'bg-amber-700 text-white ring-2 ring-amber-300 shadow-inner',
  },
];

function sourceLabel(source: FlashcardSource): string {
  if (source === 'all') return 'Toàn bộ Flashcard';
  return memoryBucketLabel(source);
}

export function FlashcardTab({
  vocab,
  activeSource,
  onSetMemoryBucket,
  onShowAllFlashcards,
}: FlashcardTabProps) {
  const baseList = useMemo(() => {
    if (activeSource === 'all') return vocab;
    return vocab.filter((item) => item.memory_bucket === activeSource);
  }, [vocab, activeSource]);

  const [queue, setQueue] = useState<Vocab[]>(() => baseList);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [touchedIds, setTouchedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const prevActiveSource = useRef<FlashcardSource>(activeSource);

  useEffect(() => {
    // If activeSource source tab changed, reset queue & index
    if (prevActiveSource.current !== activeSource) {
      prevActiveSource.current = activeSource;
      setQueue(baseList);
      setIndex(0);
      setFlipped(false);
      setInput('');
      setFeedback('none');
      setTouchedIds(new Set());
      return;
    }

    // Sync updated memory_bucket and word properties from vocab without resetting queue or index
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return baseList;
      return prevQueue.map((card) => {
        const fresh = vocab.find((v) => v.id === card.id);
        return fresh ? { ...card, ...fresh } : card;
      });
    });
  }, [baseList, vocab, activeSource]);

  const current = queue[index];

  const speakCurrent = useCallback(() => {
    if (current) speak(current.hanzi);
  }, [current]);

  useEffect(() => {
    if (current && autoSpeak) speak(current.hanzi);
  }, [index, autoSpeak]);

  const goNext = useCallback(() => {
    setFlipped(false);
    setInput('');
    setFeedback('none');
    setIndex((i) => (i + 1) % Math.max(queue.length, 1));
  }, [queue.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setInput('');
    setFeedback('none');
    setIndex((i) => (i - 1 + Math.max(queue.length, 1)) % Math.max(queue.length, 1));
  }, [queue.length]);

  const handleCheck = useCallback(() => {
    if (!current || flipped) return;
    const val = input.trim();
    if (!val) return;
    const normalized = normalizePinyinInput(val);
    const isCorrect =
      val === current.hanzi ||
      normalized === current.pinyin ||
      normalized.replace(/\s+/g, '') === current.pinyin.replace(/\s+/g, '') ||
      pinyinMatches(val, current.pinyin) ||
      pinyinMatches(normalized, current.pinyin);

    if (isCorrect) {
      setFeedback('correct');
      playTing(true);
      setFlipped(true);
      if (autoSpeak) speak(current.hanzi);
    } else {
      setFeedback('wrong');
      playTing(false);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  }, [current, input, flipped, autoSpeak]);

  const handleSetBucket = useCallback(
    async (bucket: MemoryBucket) => {
      if (!current) return;
      setTouchedIds((s) => new Set(s).add(current.id));
      const targetBucket = current.memory_bucket === bucket ? 'flashcard' : bucket;

      // Cập nhật trạng thái trực tiếp trên card hiện tại mà không làm nhảy card
      setQueue((prev) =>
        prev.map((card) =>
          card.id === current.id ? { ...card, memory_bucket: targetBucket } : card
        )
      );

      await onSetMemoryBucket(current.id, targetBucket);
    },
    [current, onSetMemoryBucket]
  );

  const handleShuffle = () => {
    setQueue((q) => shuffle(q));
    setIndex(0);
    setFlipped(false);
    setInput('');
    setFeedback('none');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (inInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCheck();
        }
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === '1') handleSetBucket('unremembered');
      else if (e.key === '2') handleSetBucket('temporary');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCheck, handleSetBucket, goNext, goPrev]);

  if (queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa có từ nào để học</h2>
        <p className="text-slate-500 mb-6">
          {activeSource === 'all'
            ? 'Hãy thêm từ mới ở tab "Thêm từ" để bắt đầu học.'
            : `Hiện chưa có từ nào trong nhóm "${sourceLabel(activeSource)}".`}
        </p>
        {activeSource !== 'all' && (
          <button
            onClick={onShowAllFlashcards}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Quay về Flashcard chung
          </button>
        )}
      </div>
    );
  }

  const progress = queue.length > 0 ? ((index + 1) / queue.length) * 100 : 0;
  const touchedCount = touchedIds.size;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {activeSource !== 'all' && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">
                Ôn tập chuyên sâu
              </p>
              <p className="text-sm text-slate-700">
                Bạn đang luyện riêng danh sách <span className="font-semibold">{sourceLabel(activeSource)}</span>.
              </p>
            </div>
            <button
              onClick={onShowAllFlashcards}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors"
            >
              <BookOpenCheck className="w-4 h-4" />
              Toàn bộ thẻ
            </button>
          </div>
        </div>
      )}

      {/* Progress + controls row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {index + 1} / {queue.length}
          </span>
          {touchedCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Đã xử lý {touchedCount}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${memoryBucketColor(
              activeSource === 'all' ? 'flashcard' : activeSource
            )}`}
          >
            {sourceLabel(activeSource)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Tráo từ"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Tráo</span>
          </button>
          <button
            onClick={() => setAutoSpeak((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              autoSpeak
                ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
                : 'text-slate-400 bg-white border-slate-200'
            }`}
            title={autoSpeak ? 'Tắt tự động phát âm' : 'Bật tự động phát âm'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Âm bật' : 'Âm tắt'}</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="flip-scene mb-4">
        <div
          className={`flip-card relative w-full ${flipped ? 'is-flipped' : ''}`}
          style={{ height: '380px' }}
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Front face */}
          <div className="flip-face absolute inset-0 rounded-3xl bg-white border border-slate-200 shadow-xl flex flex-col items-center justify-center p-6 cursor-pointer">
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakCurrent();
                }}
                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Nghe lại"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute top-4 left-4">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${memoryBucketColor(current.memory_bucket)}`}
              >
                {memoryBucketLabel(current.memory_bucket)}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span
                className="text-7xl sm:text-8xl font-bold text-slate-900 select-none"
                style={{ fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}
              >
                {current.hanzi}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-4">Nhấp để lật thẻ · Space để lật</p>
          </div>

          {/* Back face */}
          <div className="flip-face flip-face-back absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 shadow-xl flex flex-col p-6 cursor-pointer overflow-y-auto">
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakCurrent();
                }}
                className="p-2 rounded-lg bg-white/80 text-indigo-600 hover:bg-white transition-colors"
                title="Nghe lại"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center text-center">
              <span
                className="text-5xl sm:text-6xl font-bold text-slate-900 mb-3"
                style={{ fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}
              >
                {current.hanzi}
              </span>
              <p className="text-2xl font-semibold text-indigo-600 mb-2">{current.pinyin}</p>
              {current.hanviet && (
                <p className="text-base text-slate-500 mb-1">
                  <span className="font-medium">Âm Hán Việt:</span> {current.hanviet}
                </p>
              )}
              <p className="text-xl font-semibold text-slate-800 mb-3">{current.meaning}</p>
              {current.example && (
                <p className="text-sm text-slate-500 italic bg-white/60 rounded-xl px-4 py-2">
                  {current.example}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pinyin typing practice */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Gõ Pinyin hoặc chữ Hán để kiểm tra
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (feedback === 'wrong') setFeedback('none');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCheck();
              }
            }}
            placeholder="vd: ni3 hao3 hoặc nǐ hǎo hoặc 你好"
            className={`flex-1 px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder-slate-400 outline-none transition-all ${
              feedback === 'correct'
                ? 'border-emerald-400 ring-2 ring-emerald-100'
                : feedback === 'wrong'
                ? 'border-rose-400 ring-2 ring-rose-100'
                : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
            } ${shaking ? 'animate-shake' : ''}`}
            disabled={flipped}
          />
          {!flipped ? (
            <button
              onClick={handleCheck}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span className="hidden sm:inline">Kiểm tra</span>
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span className="hidden sm:inline">Thẻ tiếp theo</span>
            </button>
          )}
        </div>
        {feedback === 'correct' && (
          <p className="mt-2 text-sm font-medium text-emerald-600 animate-pop flex items-center gap-1">
            <Check className="w-4 h-4" /> Chính xác!
          </p>
        )}
        {feedback === 'wrong' && (
          <p className="mt-2 text-sm font-medium text-rose-600 animate-pop flex items-center gap-1">
            <X className="w-4 h-4" /> Chưa chính xác! Thử lại hoặc lật thẻ để xem đáp án.
          </p>
        )}
      </div>

      {/* Memory bucket buttons */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        {MEMORY_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isSaved = current.memory_bucket === action.bucket;
          return (
            <button
              key={action.bucket}
              onClick={() => handleSetBucket(action.bucket)}
              className={`flex flex-col items-center py-3 rounded-xl font-semibold transition-all ${
                isSaved ? action.savedClasses : action.classes
              } hover:scale-[1.02] active:scale-95`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {isSaved ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="text-sm">{isSaved ? action.savedLabel : action.label}</span>
              </div>
              <span className="text-[10px] opacity-80 hidden sm:block">
                {isSaved ? 'Nhấn để bỏ chọn' : action.hint}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Phím tắt: <span className="font-semibold">1</span> Chưa nhớ, <span className="font-semibold">2</span> Tạm nhớ.
      </p>

      {/* Nav arrows */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Trước
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Lật
          </button>
        </div>
        <button
          onClick={goNext}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-sm"
        >
          Tiếp <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
