import { useState, useMemo } from 'react';
import { Play, Search, RotateCcw, ArrowLeft, Trophy, Clock, XCircle, Flame, Gamepad2, CheckCircle2, Zap, Timer } from 'lucide-react';
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
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Trò chơi Ghi nhớ Mặt chữ</h1>
          </div>
          <p className="text-indigo-100">
            Chọn kích thước bàn chơi, chọn đúng số từ vựng cần thiết rồi bắt đầu thử thách ghi nhớ!
          </p>
        </div>

        {/* Game Mode Selector */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
            1. Chọn chế độ bàn chơi
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['6x5', '7x5', '8x5'] as const).map((modeKey) => {
              const count = GAME_MODE_COUNTS[modeKey];
              const isSelected = selectedMode === modeKey;
              return (
                <button
                  key={modeKey}
                  onClick={() => handleModeChange(modeKey)}
                  className={`p-4 rounded-xl border-2 font-bold text-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xl sm:text-2xl font-extrabold">{modeKey}</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
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
          className={`cursor-pointer rounded-xl p-4 border-2 transition-all select-none ${
            timePressure
              ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-orange-50 shadow-md ring-2 ring-rose-400/20'
              : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                timePressure ? 'bg-rose-500' : 'bg-slate-100'
              }`}>
                <Timer className={`w-5 h-5 ${timePressure ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className={`font-bold text-sm ${
                  timePressure ? 'text-rose-700' : 'text-slate-700'
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
              timePressure ? 'bg-rose-500' : 'bg-slate-200'
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                timePressure ? 'left-6' : 'left-0.5'
              }`} />
            </div>
          </div>
          {timePressure && (
            <div className="mt-3 flex items-start gap-2 bg-rose-100 rounded-lg p-2.5 text-xs text-rose-700">
              <Flame className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                Áp lực thời gian cực ngắn ép não vào trạng thái <strong>"Chiến đấu hoặc Bỏ chạy"</strong> — xóa tan buồn ngủ ngay lập tức!
              </span>
            </div>
          )}
        </div>

        {/* Selection Status & Quick Actions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">2. Đã chọn từ vựng:</span>
              <span className={`text-2xl font-bold ${isReady ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {selectedIds.size}
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-lg font-bold text-slate-700">{targetCount} từ</span>
            </div>

            {isReady ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã chọn đủ từ! Sẵn sàng chơi.
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all shadow hover:shadow-md"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              Chọn ngẫu nhiên đủ {targetCount} từ để chơi nhanh
            </button>
            <button
              onClick={selectAllFiltered}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Chọn {Math.min(targetCount, filteredVocab.length)} từ đầu
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Vocab Filter & List */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {labels[bucket]}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Hán tự, pinyin, nghĩa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
            {filteredVocab.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
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
                    className={`relative flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : selectedIds.size >= targetCount
                        ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl font-bold text-slate-800">{word.hanzi}</div>
                      <div className="text-xs text-slate-500 truncate">{word.meaning}</div>
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
            className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            <Play className="w-6 h-6" />
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
        <div className="lg:hidden shrink-0 flex flex-col gap-1.5 bg-white rounded-xl p-2 border border-slate-200 shadow-sm">
          {/* Countdown timer bar (time pressure) */}
          {state.timePressure && (
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerBarColor} ${isUrgent ? 'animate-pulse' : ''}`}
                style={{ width: `${timePct}%` }}
              />
            </div>
          )}

          {/* Row 1: Target word banner & Quick action buttons */}
          <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-white transition-colors ${
            isUrgent
              ? 'bg-gradient-to-r from-rose-600 to-orange-500'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
          }`}>
            <div className="min-w-0 flex-1 flex items-baseline gap-2">
              <span className="text-[10px] text-indigo-200 uppercase font-semibold shrink-0">Tìm:</span>
              <span className={`font-bold tracking-wide break-all min-w-0 ${mobilePinyinSize}`}>
                {currentWord.pinyin}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {state.timePressure && (
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isUrgent ? 'bg-white/30 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
                  {state.timeLeft}s
                </span>
              )}
              <button
                onClick={skipWord}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded text-xs font-medium transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={resetGame}
                className="p-1 bg-rose-500/30 hover:bg-rose-500/40 text-white rounded transition-colors"
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
              <span className="font-bold text-indigo-600 text-[11px] shrink-0">{state.foundWords.size}/{totalWords}</span>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-2 shrink-0 font-medium text-slate-700 text-[11px]">
              <span className="flex items-center gap-0.5" title="Điểm">
                <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                {state.score}
              </span>
              <span className="flex items-center gap-0.5 font-mono" title="Thời gian">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatTime(state.elapsedTime)}
              </span>
              {state.combo > 0 ? (
                <span className="flex items-center gap-0.5 text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded-full animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
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
          {/* Pinyin prompt */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg text-center flex flex-col justify-center min-h-[110px] overflow-hidden">
            <div className="text-xs text-indigo-100 mb-1 uppercase tracking-wider font-medium">Tìm từ có pinyin</div>
            <div className={`font-bold tracking-wide py-1 break-words max-w-full leading-tight ${desktopPinyinSize}`}>
              {currentWord.pinyin}
            </div>
          </div>

          {/* Time pressure countdown (desktop) */}
          {state.timePressure && (
            <div className={`rounded-xl p-3 border shadow-sm transition-colors ${
              isUrgent ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`flex items-center gap-1 font-medium ${isUrgent ? 'text-rose-600' : 'text-slate-500'}`}>
                  <Timer className="w-3.5 h-3.5" />
                  Thời gian
                </span>
                <span className={`font-bold font-mono text-lg ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                  {state.timeLeft}s
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${timerBarColor} ${isUrgent ? 'animate-pulse' : ''}`}
                  style={{ width: `${timePct}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Tiến độ</span>
              <span className="font-bold text-indigo-600">{state.foundWords.size}/{totalWords}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Điểm</div>
                <div className="text-lg font-bold text-slate-800">{state.score}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Thời gian</div>
                <div className="text-lg font-bold font-mono text-slate-800">{formatTime(state.elapsedTime)}</div>
              </div>
            </div>

            {state.combo > 0 ? (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-200 shadow-sm flex items-center gap-3 animate-combo-glow">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-orange-400">Combo</div>
                  <div className="text-lg font-bold text-orange-600">x{state.combo}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Sai</div>
                  <div className="text-lg font-bold text-slate-800">{state.mistakes}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={skipWord}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm"
            >
              Bỏ qua từ này
            </button>
            <button
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded-xl transition-colors border border-rose-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Thoát
            </button>
          </div>
        </div>

        {/* Grid panel */}
        <div className="flex-1 min-w-0 min-h-0 bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-3 border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className={`memory-game-grid flex-1 grid ${gridColsClass} gap-1 sm:gap-2 memory-grid-container min-h-0`}>
            {state.grid.map((cell, index) => {
              const isCorrect = cell.state === 'correct';
              const isWrong = cell.state === 'wrong';
              const hanziLen = cell.word.hanzi.length;
              const hanziSizeClass =
                hanziLen >= 4
                  ? 'text-xs sm:text-sm'
                  : hanziLen === 3
                  ? 'text-sm sm:text-lg'
                  : 'text-lg sm:text-2xl';

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
                  className={`memory-grid-cell flex items-center justify-center font-bold rounded-lg sm:rounded-xl border-2 transition-all p-1 ${
                    isCorrect
                      ? 'bg-emerald-500 text-white border-emerald-600 scale-105 shadow-lg cursor-not-allowed animate-cell-pop'
                      : isWrong
                      ? 'bg-rose-500 text-white border-rose-600 animate-cell-shake'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    animationDelay: `${index * 20}ms`,
                  }}
                >
                  {isCorrect ? (
                    <div className="flex flex-col items-center justify-center w-full min-w-0 h-full leading-tight text-center">
                      <span className={`font-bold truncate max-w-full ${hanziSizeClass}`}>
                        {cell.word.hanzi}
                      </span>
                      <span className="text-[10px] sm:text-xs font-normal opacity-95 truncate max-w-full mt-0.5 leading-none px-0.5">
                        {cell.word.meaning}
                      </span>
                    </div>
                  ) : (
                    <span className={`truncate max-w-full px-0.5 ${hanziSizeClass}`}>
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

        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div style={{ animation: 'comboGlow 1s ease-in-out infinite' }}>
              <Trophy className="w-14 h-14 text-yellow-300 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 12px rgba(253,224,71,0.9))' }} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Hoàn thành! 🎉</h1>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-sm text-indigo-100 mb-1">Tổng điểm</div>
              <div className="text-4xl font-bold">{state.score}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-sm text-indigo-100 mb-1">Thời gian</div>
              <div className="text-4xl font-bold">{formatTime(state.elapsedTime)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-sm text-indigo-100 mb-1">Combo cao nhất</div>
              <div className="text-4xl font-bold flex items-center justify-center gap-2">
                <Flame className="w-8 h-8 text-orange-300" />
                {state.maxCombo}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-sm text-indigo-100 mb-1">Độ chính xác</div>
              <div className="text-4xl font-bold">{accuracy}%</div>
            </div>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-center gap-2">
            <XCircle className="w-5 h-5 text-rose-300" />
            <span className="text-lg">
              Số lần sai: <span className="font-bold">{state.mistakes}</span>
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={handlePlayAgain}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Chơi lại
          </button>
          <button
            onClick={handleNewGame}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-slate-200"
          >
            <Play className="w-5 h-5" />
            Chọn từ mới
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Danh sách từ đã chơi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {state.gameWords.map((word) => {
              const wasFound = state.foundWords.has(word.id);
              return (
                <div
                  key={word.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    wasFound
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="text-3xl">{word.hanzi}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-600">{word.pinyin}</div>
                    <div className="text-xs text-slate-500 truncate">{word.meaning}</div>
                  </div>
                  {wasFound ? (
                    <div className="text-emerald-600 font-bold text-xs">✓</div>
                  ) : (
                    <div className="text-slate-400 font-bold text-xs">—</div>
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
