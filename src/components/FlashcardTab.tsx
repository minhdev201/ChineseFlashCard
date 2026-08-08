import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
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
  CheckCheck,
  Keyboard,
  Eye,
  EyeOff,
  CornerDownLeft,
  HelpCircle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronDown,
} from 'lucide-react';
import type { FlashcardSource, MemoryBucket, Vocab } from '@/lib/types';
import { memoryBucketColor, memoryBucketLabel } from '@/lib/srs';
import { playTing, speak } from '@/lib/speech';

interface FlashcardTabProps {
  vocab: Vocab[];
  activeSource: FlashcardSource;
  onSetMemoryBucket: (id: string, bucket: MemoryBucket) => Promise<void>;
  onShowAllFlashcards: () => void;
  onRecordReview?: () => Promise<void>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
  return a;
}

type SortMode = 'newest' | 'oldest' | 'random';

const SORT_OPTIONS: { value: SortMode; label: string; icon: typeof Shuffle }[] = [
  { value: 'newest', label: 'Mới nhất trước', icon: ArrowDownNarrowWide },
  { value: 'oldest', label: 'Cũ nhất trước', icon: ArrowUpNarrowWide },
  { value: 'random', label: 'Ngẫu nhiên', icon: Shuffle },
];

const MEMORY_ACTIONS: {
  bucket: MemoryBucket;
  label: string;
  savedLabel: string;
  hint: string;
  icon: typeof Pin;
  classes: string;
  savedClasses: string;
}[] = [
    {
      bucket: 'unremembered',
      label: 'Chưa nhớ (1)',
      savedLabel: 'Đã lưu Chưa nhớ',
      hint: 'Ôn tập gắt gao',
      icon: Pin,
      classes: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20',
      savedClasses: 'bg-rose-700 text-white ring-2 ring-rose-300 shadow-inner font-bold',
    },
    {
      bucket: 'temporary',
      label: 'Tạm nhớ (2)',
      savedLabel: 'Đã lưu Tạm nhớ',
      hint: 'Tiếp tục củng cố',
      icon: SunMedium,
      classes: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20',
      savedClasses: 'bg-amber-700 text-white ring-2 ring-amber-300 shadow-inner font-bold',
    },
    {
      bucket: 'flashcard',
      label: 'Đã nhớ (3)',
      savedLabel: 'Đã lưu Đã nhớ',
      hint: 'Hoàn thành ghi nhớ',
      icon: CheckCheck,
      classes: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
      savedClasses: 'bg-emerald-800 text-white ring-2 ring-emerald-300 shadow-inner font-bold',
    },
  ];

const TONE_SYMBOLS = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ǖ', 'ǘ', 'ǚ', 'ǜ'];

function sourceLabel(source: FlashcardSource): string {
  if (source === 'all') return 'Toàn bộ Flashcard';
  return memoryBucketLabel(source);
}

/** Returns dynamic fontSize + letterSpacing based on hanzi character count */
function getHanziSize(text: string): { fontSize: string; letterSpacing: string } {
  const len = text.length;
  if (len <= 2) return { fontSize: 'clamp(3.5rem, 8vw, 4.5rem)', letterSpacing: '0.12em' };
  if (len <= 4) return { fontSize: 'clamp(3rem, 7vw, 4rem)', letterSpacing: '0.08em' };
  if (len <= 6) return { fontSize: 'clamp(2.25rem, 5.5vw, 3rem)', letterSpacing: '0.04em' };
  if (len <= 8) return { fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)', letterSpacing: '0.02em' };
  if (len <= 12) return { fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', letterSpacing: '0.01em' };
  return { fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', letterSpacing: '0em' };
}

/** Same but slightly smaller for the back face */
function getHanziSizeBack(text: string): { fontSize: string; letterSpacing: string } {
  const len = text.length;
  if (len <= 2) return { fontSize: 'clamp(3rem, 7vw, 3.75rem)', letterSpacing: '0.1em' };
  if (len <= 4) return { fontSize: 'clamp(2.5rem, 6vw, 3.25rem)', letterSpacing: '0.06em' };
  if (len <= 6) return { fontSize: 'clamp(2rem, 5vw, 2.75rem)', letterSpacing: '0.03em' };
  if (len <= 8) return { fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', letterSpacing: '0.02em' };
  if (len <= 12) return { fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', letterSpacing: '0.01em' };
  return { fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', letterSpacing: '0em' };
}

export function FlashcardTab({
  vocab,
  activeSource,
  onSetMemoryBucket,
  onShowAllFlashcards,
  onRecordReview,
}: FlashcardTabProps) {
  const filteredList = useMemo(() => {
    if (activeSource === 'all') return vocab;
    return vocab.filter((item) => item.memory_bucket === activeSource);
  }, [vocab, activeSource]);

  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const baseList = useMemo(() => {
    if (sortMode === 'newest') return [...filteredList].reverse();
    if (sortMode === 'random') return shuffle(filteredList);
    return filteredList; // oldest = original created_at ascending
  }, [filteredList, sortMode]);

  const [queue, setQueue] = useState<Vocab[]>(() => baseList);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showTianzige, setShowTianzige] = useState(true);
  const [touchedIds, setTouchedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const prevActiveSource = useRef<FlashcardSource>(activeSource);
  const prevSortMode = useRef<SortMode>(sortMode);
  const prevVocabLength = useRef<number>(vocab.length);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const sourceChanged = prevActiveSource.current !== activeSource;
    const sortChanged = prevSortMode.current !== sortMode;
    const lengthChanged = prevVocabLength.current !== vocab.length;

    if (sourceChanged || sortChanged || lengthChanged) {
      prevActiveSource.current = activeSource;
      prevSortMode.current = sortMode;
      prevVocabLength.current = vocab.length;
      setIsSwitching(true);
      setQueue(baseList);
      setIndex(0);
      setFlipped(false);
      setInput('');
      setFeedback('none');
      setTouchedIds(new Set());
      setTimeout(() => setIsSwitching(false), 60);
      return;
    }

    // Khi chỉ có cập nhật thuộc tính thẻ (ví dụ bấm 1, 2, 3 đổi bucket): Giữ nguyên thứ tự queue và index
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return baseList;
      return prevQueue.map((card) => {
        const fresh = vocab.find((v) => v.id === card.id);
        return fresh ? { ...card, ...fresh } : card;
      });
    });
  }, [baseList, vocab, activeSource, sortMode]);

  const current = queue[index];

  const speakCurrent = useCallback(() => {
    if (current) speak(current.hanzi);
  }, [current]);

  useEffect(() => {
    if (current && autoSpeak) speak(current.hanzi);
  }, [index, autoSpeak]);

  const goNext = useCallback(() => {
    setIsSwitching(true);
    setFlipped(false);
    setInput('');
    setFeedback('none');
    setIndex((i) => (i + 1) % Math.max(queue.length, 1));
    setTimeout(() => {
      setIsSwitching(false);
    }, 60);
  }, [queue.length]);

  const goPrev = useCallback(() => {
    setIsSwitching(true);
    setFlipped(false);
    setInput('');
    setFeedback('none');
    setIndex((i) => (i - 1 + Math.max(queue.length, 1)) % Math.max(queue.length, 1));
    setTimeout(() => {
      setIsSwitching(false);
    }, 60);
  }, [queue.length]);

  const handleCheck = useCallback(() => {
    if (!current || flipped) return;
    const val = input.trim();
    if (!val) return;

    // Bắt buộc kiểm tra gõ đúng chữ Hán
    const isCorrect =
      val === current.hanzi ||
      val.replace(/\s+/g, '') === current.hanzi.replace(/\s+/g, '');

    if (isCorrect) {
      setFeedback('correct');
      playTing(true);
      setFlipped(true);
      if (autoSpeak) speak(current.hanzi);
      onRecordReview?.();
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

      setQueue((prev) =>
        prev.map((card) =>
          card.id === current.id ? { ...card, memory_bucket: targetBucket } : card
        )
      );

      await onSetMemoryBucket(current.id, targetBucket);
    },
    [current, onSetMemoryBucket]
  );

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    setSortDropdownOpen(false);
    setIsSwitching(true);
    setIndex(0);
    setFlipped(false);
    setInput('');
    setFeedback('none');
    setTimeout(() => {
      setIsSwitching(false);
    }, 60);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Phím Tab: focus vào ô nhập hán ngữ, nhấn Tab lần nữa thì focus ra ngoài (blur)
      if (e.key === 'Tab') {
        e.preventDefault();
        if (document.activeElement === inputRef.current) {
          inputRef.current?.blur();
        } else {
          inputRef.current?.focus();
        }
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // Gán phím mũi tên Trái / Phải để chuyển thẻ Trước / Tiếp theo
      if (e.key === 'ArrowLeft') {
        if (!inInput || input.length === 0 || e.altKey) {
          e.preventDefault();
          goPrev();
          return;
        }
      } else if (e.key === 'ArrowRight') {
        if (!inInput || input.length === 0 || e.altKey) {
          e.preventDefault();
          goNext();
          return;
        }
      }

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
      } else if (e.key === '1') handleSetBucket('unremembered');
      else if (e.key === '2') handleSetBucket('temporary');
      else if (e.key === '3') handleSetBucket('flashcard');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCheck, handleSetBucket, goNext, goPrev, input.length]);

  if (queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Chưa có từ vựng nào</h2>
        <p className="text-slate-500 mb-6">
          {activeSource === 'all'
            ? 'Hãy chọn "Thêm từ" ở sidebar bên trái để nhập thêm từ vựng mới.'
            : `Hiện chưa có từ nào trong nhóm "${sourceLabel(activeSource)}".`}
        </p>
        {activeSource !== 'all' && (
          <button
            onClick={onShowAllFlashcards}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
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
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Controls Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
              {index + 1} / {queue.length}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold tracking-wide ${memoryBucketColor(
                activeSource === 'all' ? 'flashcard' : activeSource
              )}`}
            >
              {sourceLabel(activeSource)}
            </span>
          </div>

          {touchedCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Đã tương tác: {touchedCount}
            </span>
          )}
        </div>

        {/* Progress Bar & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:block w-36 md:w-48 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowTianzige((s) => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${showTianzige
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              title="Bật/Tắt ô lưới tập viết chữ Hán"
            >
              {showTianzige ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Ô nét chữ</span>
            </button>

            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen((s) => !s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors shadow-sm ${
                  sortDropdownOpen
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                }`}
                title="Chọn thứ tự hiển thị flashcard"
              >
                {(() => {
                  const opt = SORT_OPTIONS.find((o) => o.value === sortMode);
                  const Icon = opt?.icon ?? Shuffle;
                  return <Icon className="w-3.5 h-3.5" />;
                })()}
                <span className="hidden sm:inline">
                  {SORT_OPTIONS.find((o) => o.value === sortMode)?.label ?? 'Sắp xếp'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 animate-fade-in">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = sortMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <span>{opt.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setAutoSpeak((s) => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${autoSpeak
                  ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                  : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'
                }`}
              title={autoSpeak ? 'Tắt tự động phát âm' : 'Bật tự động phát âm khi lật'}
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{autoSpeak ? 'Tự phát âm' : 'Âm tắt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID: Left Flashcard / Right Interactive Flashcard Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT FLASHCARD VIEW COLUMN */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="flip-scene w-full">
            <div
              className={`flip-card relative w-full ${flipped ? 'is-flipped' : ''} ${isSwitching ? 'no-transition' : ''
                }`}
              style={{ minHeight: '380px' }}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* Front Face */}
              <div
                className={`flip-face absolute inset-0 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:border-indigo-300 transition-all duration-300 ${flipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                  }`}
              >
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${memoryBucketColor(
                      current.memory_bucket
                    )}`}
                  >
                    {memoryBucketLabel(current.memory_bucket)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakCurrent();
                    }}
                    className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm"
                    title="Phát âm chữ Hán"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Hanzi visual display inside stroke grid box */}
                <div className="flex-1 flex flex-col items-center justify-center my-4 w-full">
                  <div
                    className={`relative flex items-center justify-center p-6 rounded-2xl transition-all w-full max-w-[460px] ${showTianzige
                        ? 'bg-amber-50/50 border-2 border-dashed border-red-300/80 shadow-inner'
                        : ''
                      }`}
                    style={{ minWidth: '280px', minHeight: '220px' }}
                  >
                    {showTianzige && (
                      <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-red-400"></div>
                        <div className="h-full w-[1px] bg-red-400 absolute"></div>
                        <div className="w-full h-full border border-red-400 absolute"></div>
                      </div>
                    )}
                    <span
                      className="font-black text-slate-900 select-none z-10 text-center leading-snug"
                      style={{
                        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                        ...getHanziSize(current.hanzi),
                      }}
                    >
                      {current.hanzi}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <RotateCcw className="w-3.5 h-3.5" /> Nhấp hoặc gõ Space để lật mặt thẻ
                </div>
              </div>

              {/* Back Face */}
              <div
                className={`flip-face flip-face-back absolute inset-0 rounded-3xl bg-slate-900 border border-indigo-500/30 text-white shadow-2xl flex flex-col p-6 cursor-pointer overflow-y-auto justify-between transition-all duration-300 ${flipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Đáp án chi tiết
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakCurrent();
                    }}
                    className="p-2.5 rounded-2xl bg-indigo-600/40 text-indigo-200 hover:bg-indigo-600 transition-colors"
                    title="Phát âm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-auto text-center py-4 space-y-3">
                  <span
                    className="font-bold text-white block leading-snug"
                    style={{
                      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                      ...getHanziSizeBack(current.hanzi),
                    }}
                  >
                    {current.hanzi}
                  </span>
                  <p className="text-3xl font-extrabold text-indigo-300 tracking-wider">
                    {current.pinyin}
                  </p>
                  <p className="text-2xl font-bold text-emerald-300">{current.meaning}</p>
                  {current.structure && (() => {
                    const lines = current.structure.split('\n').map((l) => l.trim()).filter(Boolean);
                    const formula = lines[0];
                    const examples = lines.slice(1);
                    return (
                      <div className="mt-3 w-full max-w-sm mx-auto text-left" onClick={(e) => e.stopPropagation()}>
                        {/* Formula / Pattern */}
                        <div className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 mb-2">
                          <p className="text-xs text-amber-300/80 font-semibold mb-0.5">Cấu trúc</p>
                          <p className="text-sm font-bold text-amber-200 leading-relaxed">{formula}</p>
                        </div>
                        {/* Examples */}
                        {examples.length > 0 && (
                          <div className="space-y-1">
                            {examples.map((ex, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40"
                              >
                                <span className="text-indigo-400 text-xs mt-0.5 shrink-0">▸</span>
                                <p className="text-xs text-slate-300 leading-relaxed">{ex}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="text-center text-xs text-slate-400 font-medium">
                  Nhấn Space để lật lại thẻ
                </div>
              </div>
            </div>
          </div>

          {/* Quick Memory Rating Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {MEMORY_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isSaved = current.memory_bucket === action.bucket;
              return (
                <button
                  key={action.bucket}
                  onClick={() => handleSetBucket(action.bucket)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl font-semibold transition-all text-center ${isSaved ? action.savedClasses : action.classes
                    } hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex items-center gap-1">
                    {isSaved ? <Check className="w-4 h-4 shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
                    <span className="text-xs sm:text-sm font-bold truncate">{isSaved ? action.savedLabel : action.label}</span>
                  </div>
                  <span className="text-[10px] opacity-90 font-normal mt-0.5 truncate hidden sm:block">
                    {isSaved ? 'Nhấn để bỏ' : action.hint}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Card Prev/Next Nav Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
              title="Phím mũi tên Trái (←)"
            >
              <ChevronLeft className="w-4 h-4" /> Thẻ trước (←)
            </button>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Lật thẻ
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
              title="Phím mũi tên Phải (→)"
            >
              Tiếp theo (→) <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT INTERACTIVE FLASHCARD INPUT COLUMN (Identical Flashcard styling with Input) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div
            className={`relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-xl flex flex-col items-center justify-between p-6 transition-all ${feedback === 'correct'
                ? 'border-emerald-400 ring-4 ring-emerald-100'
                : feedback === 'wrong'
                  ? 'border-rose-400 ring-4 ring-rose-100'
                  : 'hover:border-indigo-300'
              } ${shaking ? 'animate-shake' : ''}`}
            style={{ minHeight: '380px' }}
          >
            {/* Header row inside interactive card */}
            <div className="w-full flex items-center justify-between">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" /> Tập gõ Chữ Hán
              </span>

              {input && (
                <button
                  onClick={() => setInput('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                  title="Xóa chữ"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Central Tianzige grid container with interactive Input */}
            <div
              className="flex-1 flex flex-col items-center justify-center my-4 w-full cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <div
                className={`relative flex items-center justify-center p-4 sm:p-6 rounded-2xl transition-all w-full max-w-[460px] ${showTianzige
                    ? 'bg-amber-50/50 border-2 border-dashed border-red-300/80 shadow-inner'
                    : 'bg-slate-50 border border-slate-200'
                  }`}
                style={{ minWidth: '280px', minHeight: '220px' }}
              >
                {showTianzige && (
                  <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-red-400"></div>
                    <div className="h-full w-[1px] bg-red-400 absolute"></div>
                    <div className="w-full h-full border border-red-400 absolute"></div>
                  </div>
                )}

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
                  style={{
                    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                    ...getHanziSize(input || current.hanzi),
                  }}
                  className="w-full text-center font-bold text-slate-900 placeholder:text-red-200/80 bg-transparent border-none outline-none px-2 z-10 leading-snug"
                  disabled={flipped}
                />
              </div>
            </div>

            {/* Bottom Footer inside interactive card */}
            <div className="w-full">
              {!flipped ? (
                <button
                  onClick={handleCheck}
                  disabled={!input.trim()}
                  className={`w-full py-3.5 px-5 rounded-2xl text-white font-extrabold text-base transition-all flex items-center justify-center gap-2 shadow-md ${input.trim()
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                    }`}
                >
                  <Check className="w-5 h-5" />
                  <span>Kiểm tra chữ Hán</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono hidden sm:inline">
                    Enter ↵
                  </span>
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Check className="w-5 h-5" />
                  <span>Chính xác! Chuyển thẻ tiếp theo (→)</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback states & hotkeys footer */}
          <div className="space-y-3">
            {feedback === 'correct' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 animate-pop flex items-start gap-3 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-800">Chính xác xuất sắc!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Chữ Hán: <span className="font-extrabold">{current.hanzi}</span> · Pinyin:{' '}
                    <span className="font-extrabold">{current.pinyin}</span>
                    {current.meaning && ` · Nghĩa: ${current.meaning}`}
                  </p>
                </div>
              </div>
            )}

            {feedback === 'wrong' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 animate-pop flex items-start gap-3 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                  ✕
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-rose-800">Chưa chính xác!</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Vui lòng gõ chữ Hán <span className="font-extrabold">"{current.hanzi}"</span>. Nhấp <span className="font-bold">Lật thẻ</span> để xem chi tiết.
                  </p>
                </div>
              </div>
            )}

            <div className="px-3 py-2 rounded-xl bg-slate-100/80 border border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Nhấn <strong>Tab</strong> để bật/tắt ô gõ chữ Hán.</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-500">
                <span className="bg-white px-1.5 py-0.5 rounded border text-indigo-600 font-bold">Tab</span> Bật/Tắt gõ
                <span className="bg-white px-1.5 py-0.5 rounded border">←</span> Trước
                <span className="bg-white px-1.5 py-0.5 rounded border">→</span> Tiếp
                <span className="bg-white px-1.5 py-0.5 rounded border">Space</span> Lật thẻ
                <span className="bg-white px-1.5 py-0.5 rounded border">1/2/3</span> Đánh giá
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
