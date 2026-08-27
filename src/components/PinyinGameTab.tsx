import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Search,
  RotateCcw,
  ArrowLeft,
  Trophy,
  Clock,
  XCircle,
  Flame,
  CheckCircle2,
  Zap,
  Timer,
  Volume2,
  PenTool,
  X,
  Target,
  Check,
  Lightbulb,
} from 'lucide-react';
import type { Vocab, MemoryBucket } from '@/lib/types';
import { usePinyinGame, PINYIN_GAME_TIME_LIMIT } from '@/lib/usePinyinGame';
import { playTing, speak } from '@/lib/speech';
import { RewardOverlay, ComboFlashBanner, ConfettiRain } from './RewardEffects';
import { useRewardEffects } from '@/lib/useRewardEffects';

interface PinyinGameTabProps {
  vocab: Vocab[];
}

type FilterBucket = 'all' | MemoryBucket;

export function PinyinGameTab({ vocab }: PinyinGameTabProps) {
  const {
    state,
    startGame,
    checkAnswer,
    advanceNext,
    skipQuestion,
    giveHint,
    setInput,
    resetGame,
    playAgain,
  } = usePinyinGame();

  const {
    bursts,
    popups,
    comboFlashKey,
    comboForFlash,
    triggerCorrect,
    removeBurst,
    removePopup,
    resetEffects,
  } = useRewardEffects();

  const [selectedCount, setSelectedCount] = useState<number>(10);
  const [filterBucket, setFilterBucket] = useState<FilterBucket>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [timePressure, setTimePressure] = useState(false);
  const [showTianzige, setShowTianzige] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when in playing phase and on each question change
  useEffect(() => {
    if (state.phase === 'playing') {
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [state.phase, state.currentIndex]);

  const filteredVocab = useMemo(() => {
    let filtered = vocab;

    if (filterBucket !== 'all') {
      filtered = filtered.filter((w) => w.memory_bucket === filterBucket);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.hanzi.includes(q) ||
          w.pinyin.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [vocab, filterBucket, searchQuery]);

  const poolToUse = useMemo(() => {
    if (selectedIds.size > 0) {
      return vocab.filter((w) => selectedIds.has(w.id));
    }
    return filteredVocab.length > 0 ? filteredVocab : vocab;
  }, [vocab, selectedIds, filteredVocab]);

  const actualTargetCount = Math.min(selectedCount, poolToUse.length);

  const toggleWord = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearAllSelected = () => {
    setSelectedIds(new Set());
  };

  const handleStartGame = () => {
    if (poolToUse.length === 0) return;
    startGame(poolToUse, selectedCount, timePressure);
  };

  const handlePlayAgain = () => {
    resetEffects();
    playAgain();
  };

  const handleNewGame = () => {
    resetEffects();
    resetGame();
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleSubmitAnswer = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!state.currentInput.trim()) return;

    const currentQ = state.questions[state.currentIndex];
    if (!currentQ) return;

    if (state.feedback === 'correct') {
      advanceNext();
      return;
    }

    const { isCorrect, points, combo } = checkAnswer(state.currentInput);
    if (isCorrect) {
      playTing(true);
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        triggerCorrect(rect.left + rect.width / 2, rect.top + rect.height / 2, points, combo);
      } else {
        triggerCorrect(window.innerWidth / 2, window.innerHeight / 2, points, combo);
      }

      // Auto advance after 1.2s confirmation delay
      setTimeout(() => {
        advanceNext();
      }, 1200);
    } else {
      playTing(false);
    }
  };

  const handlePronounce = (text: string) => {
    speak(text);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────
  // SETUP PHASE
  // ─────────────────────────────────────────────
  if (state.phase === 'setup') {
    const canStart = poolToUse.length > 0;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trò chơi Luyện Gõ Hán Ngữ</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Nhìn chữ Hán mục tiêu, luyện phản xạ gõ chính xác Hán ngữ vào ô Điền Tự để nhớ mặt chữ và quen tay gõ
              </p>
            </div>
          </div>
        </div>

        {/* 1. Select Quiz Count */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">1</span>
            Chọn số lượng câu hỏi
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { count: 10, label: 'Khởi động', time: '~2 phút' },
              { count: 20, label: 'Tiêu chuẩn', time: '~5 phút' },
              { count: 30, label: 'Thử thách', time: '~8 phút' },
              { count: 50, label: 'Siêu tốc', time: '~12 phút' },
            ].map((option) => {
              const isSelected = selectedCount === option.count;
              return (
                <button
                  key={option.count}
                  onClick={() => setSelectedCount(option.count)}
                  className={`p-3.5 sm:p-4 rounded-xl border-2 font-bold text-center transition-all flex flex-col items-center justify-between ${isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                >
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {option.count} câu
                  </span>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    {option.label} ({option.time})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Challenge Options (Time Attack) */}
        <div
          onClick={() => setTimePressure((v) => !v)}
          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all select-none ${timePressure
              ? 'border-amber-500 bg-gradient-to-br from-amber-50/90 to-orange-50/90 shadow-md ring-2 ring-amber-400/20'
              : 'border-slate-200 bg-white/90 hover:border-amber-300 hover:bg-amber-50/20'
            }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${timePressure ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                  }`}
              >
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-bold text-sm ${timePressure ? 'text-amber-900' : 'text-slate-700'}`}>
                  Áp lực thời gian (Time Attack)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Mỗi từ chỉ có {PINYIN_GAME_TIME_LIMIT}s — hết giờ tự sang từ tiếp theo & tính sai
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <div
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${timePressure ? 'bg-amber-500' : 'bg-slate-200'
                }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${timePressure ? 'left-6' : 'left-0.5'
                  }`}
              />
            </div>
          </div>
          {timePressure && (
            <div className="mt-3 flex items-start gap-2 bg-amber-100/80 rounded-xl p-2.5 text-xs text-amber-800 border border-amber-200/80">
              <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Áp lực thời gian giúp bạn rèn luyện phản xạ gõ Hán tự tức thì mà không cần suy nghĩ lâu!
              </span>
            </div>
          )}
        </div>

        {/* 3. Vocab Pool & Filter */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">2</span>
              Kho từ vựng luyện tập:
            </label>
            <div className="text-xs text-slate-500 font-medium">
              Sẵn có: <span className="font-bold text-indigo-600">{poolToUse.length}</span> từ vựng
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'unremembered', 'temporary', 'flashcard'] as const).map((bucket) => {
              const labels = {
                all: 'Tất cả từ',
                unremembered: 'Chưa nhớ',
                temporary: 'Tạm nhớ',
                flashcard: 'Đã nhớ',
              };
              const isActive = filterBucket === bucket;
              return (
                <button
                  key={bucket}
                  onClick={() => setFilterBucket(bucket)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                >
                  {labels[bucket]}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm từ vựng theo Hán tự, Pinyin, nghĩa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={clearAllSelected}
                className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
              >
                Bỏ chọn riêng ({selectedIds.size})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredVocab.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                Không có từ nào phù hợp với bộ lọc
              </div>
            ) : (
              filteredVocab.map((word) => {
                const isSelected = selectedIds.has(word.id);
                return (
                  <button
                    key={word.id}
                    onClick={() => toggleWord(word.id)}
                    className={`relative flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'border-slate-300 bg-white'
                        }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-normal text-slate-800 leading-tight">{word.hanzi}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{word.pinyin} · {word.meaning}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Start Game Action */}
        <div className="flex flex-col items-center gap-2 pb-6">
          <button
            onClick={handleStartGame}
            disabled={!canStart}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Play className="w-5 h-5 fill-current" />
            {canStart
              ? `Bắt đầu luyện gõ (${actualTargetCount} từ)`
              : 'Kho từ vựng đang trống — vui lòng thêm từ'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PLAYING PHASE
  // ─────────────────────────────────────────────
  if (state.phase === 'playing') {
    const currentQ = state.questions[state.currentIndex];
    if (!currentQ) return null;

    const totalQuestions = state.questions.length;
    const progress = (((state.currentIndex) / totalQuestions) * 100).toFixed(0);

    const isCorrect = state.feedback === 'correct';
    const isWrong = state.feedback === 'wrong';

    // Time pressure helpers
    const timePct = state.timePressure ? (state.timeLeft / PINYIN_GAME_TIME_LIMIT) * 100 : 100;
    const isUrgent = state.timePressure && state.timeLeft <= 5;
    const timerBarColor = state.timePressure
      ? state.timeLeft <= 5
        ? 'bg-rose-500'
        : state.timeLeft <= 10
          ? 'bg-amber-400'
          : 'bg-emerald-500'
      : 'bg-indigo-500';

    return (
      <>
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Top Header Bar: Progress & Stats */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-sm space-y-2">
            {state.timePressure && (
              <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timerBarColor} ${isUrgent ? 'animate-pulse' : ''}`}
                  style={{ width: `${timePct}%` }}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={resetGame}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Thoát trò chơi"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Câu hỏi:</span>
                  <span className="ml-1 text-sm sm:text-base font-bold text-indigo-600 font-mono">
                    {state.currentIndex + 1} / {totalQuestions}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {state.timePressure && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700'
                      }`}
                  >
                    {state.timeLeft}s
                  </span>
                )}
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-200/60 font-semibold text-xs sm:text-sm">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="font-mono">{state.score}</span>
                </div>
                {state.combo > 0 ? (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-xl shadow-sm font-bold text-xs sm:text-sm animate-pulse">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>x{state.combo}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-xl text-xs sm:text-sm">
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{state.mistakes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Target Hanzi Card (Hán ngữ mục tiêu) */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 text-center relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-36 h-36 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-indigo-300 mb-2 uppercase tracking-widest font-semibold">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Chữ Hán mục tiêu (Hán ngữ)
            </div>

            {/* Prominently displayed Hanzi */}
            <div className="my-2 flex flex-col items-center justify-center">
              <div
                style={{
                  fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
                }}
                className="text-4xl sm:text-6xl font-normal text-white tracking-widest drop-shadow-md"
              >
                {currentQ.word.hanzi}
              </div>

              {/* Audio Speaker Button (Pinyin is hidden) */}
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => handlePronounce(currentQ.word.hanzi)}
                  className="p-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-amber-300 transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe phát âm</span>
                </button>
              </div>
            </div>

            {/* Vietnamese Meaning & Pinyin: Shown automatically when correct */}
            {isCorrect ? (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-1.5 rounded-full text-sm sm:text-base font-semibold animate-pop">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{currentQ.word.pinyin} · Nghĩa: {currentQ.word.meaning}</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
              </div>
            )}
          </div>

          {/* Interactive Tianzige Typing Canvas */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-3xl p-5 sm:p-7 border-2 transition-all shadow-xl flex flex-col items-center ${isCorrect
                ? 'border-emerald-500 ring-4 ring-emerald-100'
                : isWrong
                  ? 'border-rose-500 ring-4 ring-rose-100 animate-cell-shake'
                  : 'border-slate-200/90 hover:border-indigo-300'
              }`}
          >
            {/* Top row with Tianzige grid toggle and clear button */}
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setShowTianzige((v) => !v)}
                className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <span>{showTianzige ? '🔲 Ẩn ô kẻ điền tự' : '🔳 Hiện ô kẻ điền tự'}</span>
              </button>

              {state.currentInput && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Xóa nội dung gõ"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Central Tianzige Box with Input (No placeholder) */}
            <div
              className="w-full flex justify-center my-2 cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <div
                className={`relative flex items-center justify-center p-4 sm:p-6 rounded-2xl transition-all w-full max-w-[420px] min-h-[160px] sm:min-h-[190px] ${showTianzige
                    ? 'bg-amber-50/40 border-2 border-dashed border-red-300/80 shadow-inner'
                    : 'bg-slate-50/70 border border-slate-200'
                  }`}
              >
                {showTianzige && (
                  <div className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-red-400" />
                    <div className="h-full w-[1px] bg-red-400 absolute" />
                    <div className="w-full h-full border border-red-400 absolute rounded-xl" />
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={state.currentInput}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  disabled={isCorrect}
                  style={{
                    fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
                  }}
                  className={`w-full text-center font-normal text-slate-900 bg-transparent border-none outline-none px-2 z-10 text-3xl sm:text-5xl tracking-widest ${isCorrect ? 'text-emerald-700 font-bold' : ''
                    }`}
                />
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="w-full flex items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={giveHint}
                disabled={isCorrect}
                className="px-3.5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 disabled:opacity-40"
                title="Gợi ý 1 chữ cái tiếp theo"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Gợi ý</span>
              </button>

              <button
                type="button"
                onClick={skipQuestion}
                className="px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs sm:text-sm font-semibold transition-all shrink-0"
              >
                Bỏ qua
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!state.currentInput.trim() && !isCorrect}
                className={`flex-1 py-3 px-5 rounded-2xl text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md ${isCorrect
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30'
                    : state.currentInput.trim()
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                  }`}
              >
                {isCorrect ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Đúng rồi! Chuyển tiếp (Enter ↵)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Kiểm tra</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono hidden sm:inline">
                      Enter ↵
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Reward effects overlays */}
        <RewardOverlay
          bursts={bursts}
          popups={popups}
          onBurstDone={removeBurst}
          onPopupDone={removePopup}
        />
        <ComboFlashBanner combo={comboForFlash} flashKey={comboFlashKey} />
      </>
    );
  }

  // ─────────────────────────────────────────────
  // RESULT PHASE
  // ─────────────────────────────────────────────
  if (state.phase === 'result') {
    const total = state.questions.length;
    const correctCount = state.questions.filter((q) => q.status === 'correct').length;
    const accuracy = total > 0 ? ((correctCount / total) * 100).toFixed(1) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <ConfettiRain duration={5000} />

        {/* Victory Celebration Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/30 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <div style={{ animation: 'comboGlow 1s ease-in-out infinite' }}>
              <Trophy
                className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' }}
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Hoàn thành bài luyện gõ! 🎉</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-indigo-200 mb-1 font-medium">Tổng điểm</div>
              <div className="text-2xl sm:text-4xl font-black text-amber-300 font-mono">{state.score}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-indigo-200 mb-1 font-medium">Thời gian</div>
              <div className="text-2xl sm:text-4xl font-black text-sky-300 font-mono">
                {formatTime(state.elapsedTime)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-indigo-200 mb-1 font-medium">Combo cao nhất</div>
              <div className="text-2xl sm:text-4xl font-black text-orange-400 font-mono flex items-center justify-center gap-1.5">
                <Flame className="w-6 h-6 text-orange-400 fill-current" />
                x{state.maxCombo}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-indigo-200 mb-1 font-medium">Độ chính xác</div>
              <div className="text-2xl sm:text-4xl font-black text-emerald-300 font-mono">{accuracy}%</div>
            </div>
          </div>

          <div className="mt-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Trả lời đúng: <span className="font-bold text-emerald-300">{correctCount}</span> / {total} câu
            </span>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={handlePlayAgain}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Luyện lại bài này
          </button>
          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl shadow-md hover:shadow-lg transition-all border border-slate-200"
          >
            <Play className="w-5 h-5" />
            Chọn từ mới
          </button>
        </div>

        {/* Review Table of Practiced Words */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Danh sách chi tiết các từ đã luyện
          </h3>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
            {state.questions.map((q, idx) => {
              const wasCorrect = q.status === 'correct';
              return (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handlePronounce(q.word.hanzi)}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-normal text-slate-800">{q.word.hanzi}</span>
                        <span className="text-sm font-semibold text-indigo-600 font-mono">{q.word.pinyin}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        Nghĩa: {q.word.meaning}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {wasCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Đúng
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                          <X className="w-3.5 h-3.5" /> {q.userAnswer || 'Chưa gõ'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
