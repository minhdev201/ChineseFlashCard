import { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Volume2,
  Edit2,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Layers,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookMarked,
  HelpCircle,
} from 'lucide-react';
import type { GrammarPattern } from '@/lib/types';
import { speak } from '@/lib/speech';
import { PatternFormModal } from './PatternFormModal';

interface PatternTabProps {
  patterns: GrammarPattern[];
  onAdd: (data: {
    pattern: string;
    meaning: string;
    note?: string | null;
    examples: { hanzi: string; pinyin: string; meaning: string }[];
  }) => Promise<any>;
  onUpdate: (
    id: string,
    data: {
      pattern?: string;
      meaning?: string;
      note?: string | null;
      examples?: { hanzi: string; pinyin: string; meaning: string }[];
    }
  ) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export function PatternTab({ patterns, onAdd, onUpdate, onDelete }: PatternTabProps) {
  const [viewMode, setViewMode] = useState<'library' | 'flashcard'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<GrammarPattern | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flashcard mode state
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  const filteredPatterns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patterns;
    return patterns.filter((p) => {
      const matchPattern = p.pattern.toLowerCase().includes(q);
      const matchMeaning = p.meaning.toLowerCase().includes(q);
      const matchNote = p.note?.toLowerCase().includes(q);
      const matchExamples = p.examples.some(
        (ex) =>
          ex.hanzi.toLowerCase().includes(q) ||
          ex.pinyin.toLowerCase().includes(q) ||
          ex.meaning.toLowerCase().includes(q)
      );
      return matchPattern || matchMeaning || matchNote || matchExamples;
    });
  }, [patterns, searchQuery]);

  const totalExamples = useMemo(
    () => patterns.reduce((sum, p) => sum + (p.examples?.length || 0), 0),
    [patterns]
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenAdd = () => {
    setEditingPattern(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: GrammarPattern) => {
    setEditingPattern(p);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu câu "${name}" không?`)) {
      await onDelete(id);
    }
  };

  const currentFc = filteredPatterns[fcIndex] || null;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookMarked className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Mẫu câu & Cấu trúc Ngữ pháp
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Kho lưu trữ {patterns.length} cấu trúc ngữ pháp và {totalExamples} câu ví dụ ứng dụng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'library'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Thư viện</span>
            </button>
            <button
              onClick={() => {
                setViewMode('flashcard');
                setFcIndex(0);
                setFcFlipped(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'flashcard'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Luyện tập</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mẫu câu</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR (In library mode) */}
      {viewMode === 'library' && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mẫu câu, ý nghĩa, chữ Hán hoặc pinyin..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Xóa
            </button>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredPatterns.length === 0 ? (
        <div className="max-w-md mx-auto py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchQuery ? 'Không tìm thấy mẫu câu nào phù hợp' : 'Chưa có mẫu câu nào'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {searchQuery
              ? 'Hãy thử tìm kiếm với từ khóa khác'
              : 'Bắt đầu thêm các cấu trúc ngữ pháp và mẫu câu để dễ dàng ghi nhớ!'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              Thêm mẫu câu đầu tiên
            </button>
          )}
        </div>
      ) : viewMode === 'library' ? (
        /* LIBRARY VIEW: GRID OF PATTERN CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPatterns.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Pattern Tag & Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/30 text-amber-900 font-extrabold text-sm sm:text-base tracking-wide shadow-sm">
                      <span>{p.pattern}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Chỉnh sửa mẫu câu"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.pattern)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa mẫu câu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meaning & Note */}
                <div className="mb-4">
                  <p className="text-base font-bold text-slate-800 leading-snug">{p.meaning}</p>
                  {p.note && (
                    <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">
                      💡 {p.note}
                    </p>
                  )}
                </div>

                {/* Examples Section */}
                {p.examples && p.examples.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Ví dụ minh họa ({p.examples.length})
                    </div>
                    <div className="space-y-2">
                      {p.examples.map((ex, i) => {
                        const copyKey = `${p.id}-${i}`;
                        const isCopied = copiedId === copyKey;
                        return (
                          <div
                            key={i}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-indigo-50/40 hover:border-indigo-200/80 transition-colors flex items-start justify-between gap-2.5"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span
                                  className="text-base sm:text-lg font-bold text-slate-900"
                                  style={{
                                    fontFamily:
                                      '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                                  }}
                                >
                                  {ex.hanzi}
                                </span>
                                {ex.pinyin && (
                                  <span className="text-xs font-semibold text-indigo-600">
                                    {ex.pinyin}
                                  </span>
                                )}
                              </div>
                              {ex.meaning && (
                                <p className="text-xs text-slate-600 font-medium">
                                  → {ex.meaning}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              {ex.hanzi && (
                                <button
                                  onClick={() => speak(ex.hanzi)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                                  title="Phát âm câu này"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              )}
                              {ex.hanzi && (
                                <button
                                  onClick={() => handleCopy(ex.hanzi, copyKey)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                                  title="Sao chép chữ Hán"
                                >
                                  {isCopied ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom footer tag */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cấu trúc ngữ pháp</span>
                <span className="font-mono">{p.examples?.length || 0} ví dụ</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FLASHCARD PRACTICE MODE */
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Card Top Nav */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-extrabold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
              Mẫu {fcIndex + 1} / {filteredPatterns.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFcFlipped(false);
                  setFcIndex(
                    (i) => (i - 1 + filteredPatterns.length) % filteredPatterns.length
                  );
                }}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                title="Mẫu câu trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFcFlipped(false);
                  setFcIndex((i) => (i + 1) % filteredPatterns.length);
                }}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                title="Mẫu câu tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Flip card box */}
          {currentFc && (
            <div
              className="cursor-pointer min-h-[380px] bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl flex flex-col justify-between hover:border-indigo-300 transition-all text-center relative overflow-hidden"
              onClick={() => setFcFlipped((f) => !f)}
            >
              {!fcFlipped ? (
                /* FRONT: Pattern & Meaning Quiz */
                <div className="my-auto space-y-4 py-6">
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold inline-block">
                    Cấu trúc cần nhớ
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">
                    {currentFc.pattern}
                  </h3>
                  <p className="text-lg font-bold text-indigo-600">
                    → {currentFc.meaning}
                  </p>
                  {currentFc.note && (
                    <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                      💡 {currentFc.note}
                    </p>
                  )}

                  <div className="pt-6">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <RotateCcw className="w-3.5 h-3.5" /> Nhấp để xem các ví dụ minh họa
                    </span>
                  </div>
                </div>
              ) : (
                /* BACK: Examples & Audio */
                <div className="my-auto space-y-4 py-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Các ví dụ ứng dụng
                    </span>
                    <span className="text-xs font-extrabold text-amber-800">
                      {currentFc.pattern}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {currentFc.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-2">
                            <span
                              className="text-base sm:text-lg font-bold text-slate-900"
                              style={{
                                fontFamily:
                                  '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                              }}
                            >
                              {ex.hanzi}
                            </span>
                            {ex.pinyin && (
                              <span className="text-xs font-semibold text-indigo-600">
                                {ex.pinyin}
                              </span>
                            )}
                          </div>
                          {ex.meaning && (
                            <p className="text-xs text-slate-600 font-medium">
                              {ex.meaning}
                            </p>
                          )}
                        </div>

                        {ex.hanzi && (
                          <button
                            onClick={() => speak(ex.hanzi)}
                            className="p-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 border border-slate-200 shadow-sm shrink-0"
                            title="Phát âm"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Nhấp để quay lại mặt trước
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Shortcuts Hint */}
          <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chế độ ôn tập giúp bạn ghi nhớ công thức và phản xạ câu ví dụ nhanh.</span>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {modalOpen && (
        <PatternFormModal
          initialData={editingPattern}
          onClose={() => {
            setModalOpen(false);
            setEditingPattern(null);
          }}
          onSave={async (data) => {
            if (editingPattern) {
              await onUpdate(editingPattern.id, data);
            } else {
              await onAdd(data);
            }
          }}
        />
      )}
    </div>
  );
}
