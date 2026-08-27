import { useState, useMemo } from 'react';
import { Play, Search, RotateCcw, ArrowLeft, Trophy, Clock, XCircle, Flame, Gamepad2, CheckCircle2, Zap, Timer, Target } from 'lucide-react';
import type { Vocab, MemoryBucket } from '@/lib/types';
import { useMemoryGame, GAME_MODE_COUNTS, TIME_PRESSURE_SECONDS, type GameMode } from '@/lib/useMemoryGame';
import { RewardOverlay, ComboFlashBanner, ConfettiRain } from './RewardEffects';
import { useRewardEffects } from '@/lib/useRewardEffects';

interface MemoryGameTabProps {
  vocab: Vocab[];
}

type FilterBucket = 'all' | MemoryBucket;

export function MemoryGameTab({ vocab }: MemoryGameTabProps) {
  const { state, startGame, selectCell, skipWord, resetGame, playAgain } = useMemoryGame();
  const { bursts, popups, comboFlashKey, comboForFlash, triggerCorrect, removeBurst, removePopup, resetEffects } = useRewardEffects();

  const [selectedMode, setSelectedMode] = useState<GameMode>('6x5');
  const [filterBucket, setFilterBucket] = useState<FilterBucket>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [timePressure, setTimePressure] = useState(false);

  const targetCount = GAME_MODE_COUNTS[selectedMode];

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    const newTargetCount = GAME_MODE_COUNTS[mode];
    if (selectedIds.size > newTargetCount) {
      const trimmed = Array.from(selectedIds).slice(0, newTargetCount);
      setSelectedIds(new Set(trimmed));
    }
  };

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

  const selectedWords = useMemo(() => {
    return vocab.filter((w) => selectedIds.has(w.id));
  }, [vocab, selectedIds]);

  const toggleWord = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (newSet.size < targetCount) {
          newSet.add(id);
        }
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    const ids = filteredVocab.slice(0, targetCount).map((w) => w.id);
    setSelectedIds(new Set(ids));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const selectRandomTargetCount = () => {
    const pool = filteredVocab.length >= targetCount ? filteredVocab : vocab;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const ids = shuffled.slice(0, Math.min(targetCount, pool.length)).map((w) => w.id);
    setSelectedIds(new Set(ids));
  };

  const handleStart = () => {
    if (selectedIds.size !== targetCount) return;
    startGame(selectedWords, selectedMode, timePressure);
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
    setFilterBucket('all');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (state.phase === 'setup') {
    const isReady = selectedIds.size === targetCount;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trò chơi Ghi nhớ Mặt chữ</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Rèn luyện phản xạ nhận diện chữ Hán siêu tốc qua bàn cờ lật thẻ
              </p>
            </div>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">1</span>
            Chọn kích thước bàn chơi
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['6x5', '7x5', '8x5'] as const).map((modeKey) => {
              const count = GAME_MODE_COUNTS[modeKey];
              const isSelected = selectedMode === modeKey;
              const modeLabels = {
                '6x5': { badge: 'Cơ bản', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                '7x5': { badge: 'Nâng cao', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                '8x5': { badge: 'Thử thách', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              };
              return (
                <button
                  key={modeKey}
                  onClick={() => handleModeChange(modeKey)}
                  className={`p-3.5 sm:p-4 rounded-xl border-2 font-bold text-center transition-all flex flex-col items-center justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-1 ${modeLabels[modeKey].color}`}>
                    {modeLabels[modeKey].badge}
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{modeKey}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    {count} ô ({count} từ)
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Pressure Option */}
        <div
          onClick={() => setTimePressure((v) => !v)}
          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all select-none ${
            timePressure
              ? 'border-amber-500 bg-gradient-to-br from-amber-50/90 to-orange-50/90 shadow-md ring-2 ring-amber-400/20'
              : 'border-slate-200 bg-white/90 hover:border-amber-300 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                timePressure ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}>
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-bold text-sm ${
                  timePressure ? 'text-amber-900' : 'text-slate-700'
                }`}>
                  Áp lực thời gian (Time Pressure)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Mỗi từ chỉ có {TIME_PRESSURE_SECONDS}s — hết giờ tự sang từ tiếp & tính sai
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              timePressure ? 'bg-amber-500' : 'bg-slate-200'
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                timePressure ? 'left-6' : 'left-0.5'
              }`} />
            </div>
          </div>
          {timePressure && (
            <div className="mt-3 flex items-start gap-2 bg-amber-100/80 rounded-xl p-2.5 text-xs text-amber-800 border border-amber-200/80">
              <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Áp lực thời gian cực ngắn kích hoạt phản xạ nhanh — tăng độ tập trung và nhớ chữ sâu hơn!
              </span>
            </div>
          )}
        </div>

        {/* Selection Status & Quick Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">2</span>
              <span className="text-sm font-semibold text-slate-700">Đã chọn từ vựng:</span>
              <span className={`text-2xl font-bold font-mono ${isReady ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {selectedIds.size}
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-base font-bold text-slate-600">{targetCount} từ</span>
            </div>

            {isReady ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 font-semibold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã chọn đủ {targetCount} từ! Sẵn sàng chơi.
              </div>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 font-medium">
                ⚠️ Cần chọn thêm {targetCount - selectedIds.size} từ để bắt đầu
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap pt-1">
            <button
              onClick={selectRandomTargetCount}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl transition-all shadow hover:shadow-md"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Chọn ngẫu nhiên đủ {targetCount} từ để chơi nhanh
            </button>
            <button
              onClick={selectAllFiltered}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              Chọn {Math.min(targetCount, filteredVocab.length)} từ đầu
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Vocab Filter & List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'unremembered', 'temporary', 'flashcard'] as const).map((bucket) => {
              const labels = {
                all: 'Tất cả',
                unremembered: 'Chưa nhớ',
                temporary: 'Tạm nhớ',
                flashcard: 'Đã nhớ',
              };
              const isActive = filterBucket === bucket;
              return (
                <button
                  key={bucket}
                  onClick={() => setFilterBucket(bucket)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {labels[bucket]}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Hán tự, pinyin, nghĩa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
            {filteredVocab.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-400 text-sm">
                Không có từ nào phù hợp
              </div>
            ) : (
              filteredVocab.map((word) => {
                const isSelected = selectedIds.has(word.id);
                return (
                  <button
                    key={word.id}
                    onClick={() => toggleWord(word.id)}
                    disabled={!isSelected && selectedIds.size >= targetCount}
                    className={`relative flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
                        : selectedIds.size >= targetCount
                        ? 'border-slate-200 bg-slate-50/50 opacity-40 cursor-not-allowed'
                        : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
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

        {/* Start Play Button */}
        <div className="flex flex-col items-center gap-2 pb-6">
          <button
            onClick={handleStart}
            disabled={!isReady}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            {isReady ? `Bắt đầu chơi (Bàn ${selectedMode})` : `Cần chọn đủ ${targetCount} từ để bắt đầu`}
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'playing') {
    const currentWord = state.gameWords[state.currentWordIndex];
    const totalWords = state.grid.length;
    const progress = ((state.foundWords.size / totalWords) * 100).toFixed(0);

    const pinyinLen = currentWord.pinyin.length;
    const desktopPinyinSize =
      pinyinLen > 14
        ? 'text-xl xl:text-2xl'
        : pinyinLen > 10
        ? 'text-2xl xl:text-3xl'
        : pinyinLen > 7
        ? 'text-3xl xl:text-4xl'
        : 'text-4xl xl:text-5xl';

    const mobilePinyinSize =
      pinyinLen > 14
        ? 'text-xs sm:text-sm'
        : pinyinLen > 10
        ? 'text-sm sm:text-base'
        : pinyinLen > 7
        ? 'text-base sm:text-lg'
        : 'text-lg sm:text-xl';

    const gridColsClass =
      state.mode === '8x5'
        ? 'grid-cols-5 sm:grid-cols-8'
        : state.mode === '7x5'
        ? 'grid-cols-5 sm:grid-cols-7'
        : 'grid-cols-5 sm:grid-cols-6';

    // Time pressure helpers
    const timePct = state.timePressure ? (state.timeLeft / TIME_PRESSURE_SECONDS) * 100 : 100;
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
      <div className="memory-game-playing-container flex flex-col lg:flex-row gap-2 lg:gap-4 overflow-hidden">
        {/* Mobile compact header (< lg) */}
        <div className="lg:hidden shrink-0 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm rounded-xl p-2 border border-slate-200/90 shadow-sm">
          {/* Countdown timer bar (time pressure) */}
          {state.timePressure && (
            <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerBarColor} ${isUrgent ? 'animate-pulse' : ''}`}
                style={{ width: `${timePct}%` }}
              />
            </div>
          )}

          {/* Row 1: Target word banner & Quick action buttons */}
          <div className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-white transition-colors shadow-md ${
            isUrgent
              ? 'bg-gradient-to-r from-rose-600 to-orange-600 shadow-rose-900/20'
              : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20'
          }`}>
            <div className="min-w-0 flex-1 flex items-baseline gap-2">
              <span className="text-[10px] text-indigo-300 uppercase font-bold shrink-0 tracking-wider">Tìm:</span>
              <span className={`font-extrabold tracking-wide break-all min-w-0 text-amber-300 ${mobilePinyinSize}`}>
                {currentWord.pinyin}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {state.timePressure && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
                  {state.timeLeft}s
                </span>
              )}
              <button
                onClick={skipWord}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={resetGame}
                className="p-1.5 bg-rose-500/30 hover:bg-rose-500/40 text-white rounded-lg transition-colors"
                title="Thoát"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Progress & Stats */}
          <div className="flex items-center justify-between gap-2 text-xs px-1">
            {/* Progress bar */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="font-bold text-indigo-600 text-[11px] shrink-0 font-mono">{state.foundWords.size}/{totalWords}</span>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-2 shrink-0 font-medium text-slate-700 text-[11px]">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200/60 font-semibold" title="Điểm">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {state.score}
              </span>
              <span className="flex items-center gap-1 bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-md border border-sky-200/60 font-mono" title="Thời gian">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                {formatTime(state.elapsedTime)}
              </span>
              {state.combo > 0 ? (
                <span className="flex items-center gap-1 text-white font-bold bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  x{state.combo}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-rose-500">
                  <XCircle className="w-3.5 h-3.5" />
                  {state.mistakes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desktop left info panel (>= lg) */}
        <div className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col gap-3">
          {/* Target Pinyin prompt card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-indigo-500/20 text-center flex flex-col justify-center min-h-[120px] overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-indigo-300 mb-1.5 uppercase tracking-widest font-semibold">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Tìm chữ có Pinyin
            </div>
            <div className={`font-extrabold tracking-wide py-1 break-words max-w-full leading-tight text-amber-300 drop-shadow-sm ${desktopPinyinSize}`}>
              {currentWord.pinyin}
            </div>
          </div>

          {/* Time pressure countdown (desktop) */}
          {state.timePressure && (
            <div className={`rounded-2xl p-3.5 border shadow-sm transition-colors ${
              isUrgent ? 'bg-rose-50/90 border-rose-300' : 'bg-white/90 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`flex items-center gap-1.5 font-semibold ${isUrgent ? 'text-rose-600' : 'text-slate-600'}`}>
                  <Timer className="w-4 h-4" />
                  Thời gian còn lại
                </span>
                <span className={`font-bold font-mono text-lg ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                  {state.timeLeft}s
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timerBarColor} ${isUrgent ? 'animate-pulse' : ''}`}
                  style={{ width: `${timePct}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-slate-600">Tiến độ hoàn thành</span>
              <span className="font-bold font-mono text-indigo-600">{state.foundWords.size}/{totalWords}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Điểm tích lũy</div>
                <div className="text-lg font-bold text-slate-800 font-mono">{state.score}</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Thời gian chơi</div>
                <div className="text-lg font-bold font-mono text-slate-800">{formatTime(state.elapsedTime)}</div>
              </div>
            </div>

            {state.combo > 0 ? (
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl p-3 shadow-lg shadow-orange-500/20 flex items-center gap-3 animate-combo-glow">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-white fill-current animate-flame" />
                </div>
                <div>
                  <div className="text-xs text-amber-100 font-medium">Combo chuỗi đúng</div>
                  <div className="text-xl font-black font-mono">x{state.combo}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Số lần sai</div>
                  <div className="text-lg font-bold text-slate-800 font-mono">{state.mistakes}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={skipWord}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm"
            >
              Bỏ qua từ này
            </button>
            <button
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50/80 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl transition-all border border-rose-200/80 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Thoát bàn chơi
            </button>
          </div>
        </div>

        {/* Grid panel */}
        <div className="flex-1 min-w-0 min-h-0 bg-slate-100/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1.5 sm:p-3 border border-slate-200/90 shadow-inner flex flex-col overflow-hidden">
          <div className={`memory-game-grid flex-1 grid ${gridColsClass} gap-1 sm:gap-2 memory-grid-container min-h-0`}>
            {state.grid.map((cell, index) => {
              const isCorrect = cell.state === 'correct';
              const isWrong = cell.state === 'wrong';
              const hanziLen = cell.word.hanzi.length;
              
              const hanziSizeClass =
                hanziLen >= 4
                  ? 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl'
                  : hanziLen === 3
                  ? 'text-base sm:text-xl md:text-2xl lg:text-3xl'
                  : hanziLen === 2
                  ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.5rem]'
                  : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';

              const correctHanziSizeClass =
                hanziLen >= 4
                  ? 'text-xs sm:text-sm md:text-base lg:text-lg'
                  : hanziLen === 3
                  ? 'text-sm sm:text-base md:text-lg lg:text-xl'
                  : hanziLen === 2
                  ? 'text-base sm:text-xl md:text-2xl lg:text-3xl'
                  : 'text-lg sm:text-2xl md:text-3xl lg:text-4xl';

              return (
                <button
                  key={cell.id}
                  onClick={(e) => {
                    const prevCombo = state.combo;
                    selectCell(cell.id);
                    // We trigger optimistically: if the word matches current target
                    const currentWord = state.gameWords[state.currentWordIndex];
                    if (cell.word.id === currentWord.id && cell.state !== 'correct') {
                      const newCombo = prevCombo + 1;
                      const comboBonus = Math.floor(newCombo / 3) * 2;
                      const pts = 10 + comboBonus;
                      triggerCorrect(e.clientX, e.clientY, pts, newCombo);
                    }
                  }}
                  disabled={isCorrect}
                  className={`memory-grid-cell flex items-center justify-center font-normal rounded-lg sm:rounded-xl border transition-all p-1 select-none ${
                    isCorrect
                      ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-400/40 shadow-[0_4px_12px_rgba(16,185,129,0.3)] scale-105 cursor-default animate-cell-pop'
                      : isWrong
                      ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400/40 shadow-[0_4px_12px_rgba(244,63,94,0.3)] animate-cell-shake'
                      : 'bg-gradient-to-b from-white to-slate-50/90 text-slate-800 border-slate-200/90 shadow-[0_2px_4px_rgba(15,23,42,0.04),0_1px_1px_rgba(15,23,42,0.02)] hover:border-indigo-400 hover:bg-gradient-to-b hover:from-white hover:to-indigo-50/60 hover:text-indigo-900 hover:shadow-[0_4px_12px_rgba(99,102,241,0.16)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
                  }`}
                  style={{
                    animationDelay: `${index * 20}ms`,
                  }}
                >
                  {isCorrect ? (
                    <div className="flex flex-col items-center justify-center w-full min-w-0 h-full leading-tight text-center">
                      <span className={`font-normal tracking-wide truncate max-w-full leading-none drop-shadow-sm ${correctHanziSizeClass}`}>
                        {cell.word.hanzi}
                      </span>
                      <span className="text-[10px] sm:text-xs font-normal text-emerald-100/95 truncate max-w-full mt-0.5 leading-none px-0.5">
                        {cell.word.meaning}
                      </span>
                    </div>
                  ) : (
                    <span className={`truncate max-w-full px-0.5 font-normal tracking-wide leading-none ${hanziSizeClass}`}>
                      {cell.word.hanzi}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reward effects overlay */}
      <RewardOverlay bursts={bursts} popups={popups} onBurstDone={removeBurst} onPopupDone={removePopup} />
      <ComboFlashBanner combo={comboForFlash} flashKey={comboFlashKey} />
    </>
    );
  }

  if (state.phase === 'result') {
    const accuracy = state.gameWords.length > 0
      ? ((state.gameWords.length - state.mistakes) / state.gameWords.length * 100).toFixed(1)
      : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Confetti rain on completion */}
        <ConfettiRain duration={5000} />

        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/30 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <div style={{ animation: 'comboGlow 1s ease-in-out infinite' }}>
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Hoàn thành thử thách! 🎉</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-indigo-200 mb-1 font-medium">Tổng điểm</div>
              <div className="text-2xl sm:text-4xl font-black text-amber-300 font-mono">{state.score}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-indigo-200 mb-1 font-medium">Thời gian</div>
              <div className="text-2xl sm:text-4xl font-black text-sky-300 font-mono">{formatTime(state.elapsedTime)}</div>
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
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>
              Số lần chọn chưa đúng: <span className="font-bold text-rose-300">{state.mistakes}</span>
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={handlePlayAgain}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Chơi lại bàn này
          </button>
          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl shadow-md hover:shadow-lg transition-all border border-slate-200"
          >
            <Play className="w-5 h-5" />
            Chọn từ mới
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Danh sách từ đã chơi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {state.gameWords.map((word) => {
              const wasFound = state.foundWords.has(word.id);
              return (
                <div
                  key={word.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    wasFound
                      ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                      : 'bg-slate-50/60 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="text-3xl font-normal text-slate-800">{word.hanzi}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700">{word.pinyin}</div>
                    <div className="text-xs text-slate-500 truncate">{word.meaning}</div>
                  </div>
                  {wasFound ? (
                    <div className="text-emerald-600 font-bold text-xs bg-emerald-100/80 px-2 py-0.5 rounded-full">✓ Đúng</div>
                  ) : (
                    <div className="text-slate-400 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-full">— Bỏ qua</div>
                  )}
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

