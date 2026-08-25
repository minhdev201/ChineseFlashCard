import { useState, useMemo } from 'react';
import { Play, Search, RotateCcw, ArrowLeft, Trophy, Clock, XCircle, Flame, Gamepad2 } from 'lucide-react';
import type { Vocab, MemoryBucket } from '@/lib/types';
import { useMemoryGame } from '@/lib/useMemoryGame';

interface MemoryGameTabProps {
  vocab: Vocab[];
}

type FilterBucket = 'all' | MemoryBucket;

export function MemoryGameTab({ vocab }: MemoryGameTabProps) {
  const { state, startGame, selectCell, skipWord, resetGame, playAgain } = useMemoryGame();

  const [filterBucket, setFilterBucket] = useState<FilterBucket>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        if (newSet.size < 30) {
          newSet.add(id);
        }
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const ids = filteredVocab.slice(0, 30).map((w) => w.id);
    setSelectedIds(new Set(ids));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const selectRandom = (count: number) => {
    const shuffled = [...filteredVocab].sort(() => Math.random() - 0.5);
    const ids = shuffled.slice(0, Math.min(count, 30)).map((w) => w.id);
    setSelectedIds(new Set(ids));
  };

  const handleStart = () => {
    if (selectedWords.length === 0) return;
    startGame(selectedWords, vocab);
  };

  const handlePlayAgain = () => {
    playAgain(vocab);
  };

  const handleNewGame = () => {
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
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Trò chơi Ghi nhớ Mặt chữ</h1>
          </div>
          <p className="text-indigo-100">
            Chọn tối đa 30 từ từ kho, sau đó tìm từ Hán tự dựa trên gợi ý pinyin!
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Đã chọn:</span>
              <span className="text-2xl font-bold text-indigo-600">{selectedIds.size}</span>
              <span className="text-slate-400">/</span>
              <span className="text-lg text-slate-500">30 từ</span>
            </div>
            {selectedIds.size < 30 && selectedIds.size > 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                ⚡ Thiếu {30 - selectedIds.size} từ — sẽ lấy thêm ngẫu nhiên khi bắt đầu
              </div>
            )}
          </div>
        </div>

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

          <div className="flex gap-2 flex-wrap">
            <button onClick={selectAll} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              Chọn tất cả
            </button>
            <button onClick={clearAll} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              Bỏ chọn tất cả
            </button>
            <button onClick={() => selectRandom(10)} className="px-3 py-1.5 text-xs font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors">
              Chọn ngẫu nhiên 10 từ
            </button>
            <button onClick={() => selectRandom(20)} className="px-3 py-1.5 text-xs font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors">
              Chọn ngẫu nhiên 20 từ
            </button>
            <button onClick={() => selectRandom(30)} className="px-3 py-1.5 text-xs font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors">
              Chọn ngẫu nhiên 30 từ
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                    disabled={!isSelected && selectedIds.size >= 30}
                    className={`relative flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : selectedIds.size >= 30
                        ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
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

        <div className="flex justify-center">
          <button
            onClick={handleStart}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            <Play className="w-6 h-6" />
            Bắt đầu chơi
          </button>
        </div>
      </div>
    );
  }



  if (state.phase === 'playing') {
    const currentWord = state.gameWords[state.currentWordIndex];
    const totalWords = state.grid.length;
    const progress = ((state.foundWords.size / totalWords) * 100).toFixed(0);

    return (
      <div className="memory-game-playing-container flex flex-col lg:flex-row gap-4">
        {/* Left info panel */}
        <div className="lg:w-64 xl:w-72 shrink-0 flex flex-col gap-3">
          {/* Pinyin prompt */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg text-center">
            <div className="text-xs text-indigo-100 mb-1 uppercase tracking-wider font-medium">Tìm từ có pinyin</div>
            <div className="text-4xl xl:text-5xl font-bold tracking-wide py-2">{currentWord.pinyin}</div>
            <div className="text-sm text-indigo-200 mt-1">{currentWord.meaning}</div>
          </div>

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
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
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
          <div className="flex lg:flex-col gap-2 mt-auto">
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

        {/* Right grid panel */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col">
          <div className="memory-game-grid flex-1 grid grid-cols-5 sm:grid-cols-6 gap-2 memory-grid-container">
            {state.grid.map((cell, index) => {
              const isCorrect = cell.state === 'correct';
              const isWrong = cell.state === 'wrong';

              return (
                <button
                  key={cell.id}
                  onClick={() => selectCell(cell.id)}
                  disabled={isCorrect}
                  className={`memory-grid-cell flex items-center justify-center text-2xl sm:text-3xl font-bold rounded-xl border-2 transition-all ${
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
                  {cell.word.hanzi}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }




  if (state.phase === 'result') {
    const accuracy = state.gameWords.length > 0
      ? ((state.gameWords.length - state.mistakes) / state.gameWords.length * 100).toFixed(1)
      : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-300" />
            <h1 className="text-4xl font-bold">Hoàn thành!</h1>
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
