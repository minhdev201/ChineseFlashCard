import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Search,
  Check,
  X,
  Shuffle,
  ListFilter,
  CheckSquare,
  Square,
  Eye,
  Layers,
  Scissors,
  Sparkles,
  Info,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import type { Vocab, MemoryBucket } from '@/lib/types';
import { memoryBucketLabel, memoryBucketColor } from '@/lib/srs';

interface PrintVocabTabProps {
  vocab: Vocab[];
  initialSelectedIds?: string[];
  onBackToList?: () => void;
}

const MAX_PRINT_WORDS = 20;

export function PrintVocabTab({ vocab, initialSelectedIds = [], onBackToList }: PrintVocabTabProps) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedIds.length > 0) {
      return initialSelectedIds.slice(0, MAX_PRINT_WORDS);
    }
    // Default: select up to first 20 words
    return vocab.slice(0, MAX_PRINT_WORDS).map((v) => v.id);
  });

  // Sync if initialSelectedIds changes externally
  useEffect(() => {
    if (initialSelectedIds.length > 0) {
      setSelectedIds(initialSelectedIds.slice(0, MAX_PRINT_WORDS));
    }
  }, [initialSelectedIds]);

  // Search & Filter state for word picker
  const [searchQuery, setSearchQuery] = useState('');
  const [bucketFilter, setBucketFilter] = useState<MemoryBucket | 'all'>('all');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Print Layout & Formatting options
  const [previewTab, setPreviewTab] = useState<'both' | 'page1' | 'page2'>('both');
  const [duplexMode, setDuplexMode] = useState<boolean>(true); // Mirrored columns on page 2 for duplex card cutting
  const [layoutMode, setLayoutMode] = useState<'grid4x5' | 'list2x10'>('grid4x5');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [showPageHeaders, setShowPageHeaders] = useState<boolean>(true);
  const [showIndexNumber, setShowIndexNumber] = useState<boolean>(true);

  // Map of all vocab for rapid lookup
  const vocabMap = useMemo(() => {
    const map = new Map<string, Vocab>();
    vocab.forEach((v) => map.set(v.id, v));
    return map;
  }, [vocab]);

  // The actual selected vocab items in exact order (up to 20)
  const selectedVocabList = useMemo(() => {
    return selectedIds
      .map((id) => vocabMap.get(id))
      .filter((v): v is Vocab => Boolean(v));
  }, [selectedIds, vocabMap]);

  // Filtered vocabulary list for picker
  const filteredVocab = useMemo(() => {
    let result = vocab;
    if (bucketFilter !== 'all') {
      result = result.filter((v) => v.memory_bucket === bucketFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((v) =>
        [v.hanzi, v.pinyin, v.meaning].filter(Boolean).some((f) => f.toLowerCase().includes(q))
      );
    }
    return result;
  }, [vocab, bucketFilter, searchQuery]);

  // Handlers for word selection
  const handleToggleWord = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setWarningMessage(null);
    } else {
      if (selectedIds.length >= MAX_PRINT_WORDS) {
        setWarningMessage(`Chỉ được chọn tối đa ${MAX_PRINT_WORDS} từ cho định dạng chuẩn 2 trang.`);
        setTimeout(() => setWarningMessage(null), 3500);
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
      setWarningMessage(null);
    }
  };

  const handleSelectFirst20 = () => {
    const source = filteredVocab.length > 0 ? filteredVocab : vocab;
    const newIds = source.slice(0, MAX_PRINT_WORDS).map((v) => v.id);
    setSelectedIds(newIds);
    setWarningMessage(null);
  };

  const handleSelectRandom20 = () => {
    const source = filteredVocab.length > 0 ? [...filteredVocab] : [...vocab];
    // Fisher-Yates shuffle
    for (let i = source.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [source[i], source[j]] = [source[j], source[i]];
    }
    const newIds = source.slice(0, MAX_PRINT_WORDS).map((v) => v.id);
    setSelectedIds(newIds);
    setWarningMessage(null);
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    setWarningMessage(null);
  };

  // Trigger print dialog
  const handlePrint = () => {
    window.print();
  };

  // Prepare fixed 20 slots for Page 1 and Page 2
  // Format is GUARANTEED to have 20 slots so it always fits 2 pages exactly
  const slots: (Vocab | null)[] = useMemo(() => {
    const list: (Vocab | null)[] = [];
    for (let i = 0; i < MAX_PRINT_WORDS; i++) {
      list.push(selectedVocabList[i] || null);
    }
    return list;
  }, [selectedVocabList]);

  // Generate Page 2 slots (with column mirroring if duplex mode is enabled)
  const page2Slots = useMemo(() => {
    if (!duplexMode) {
      return slots.map((item, idx) => ({ item, originalIndex: idx }));
    }

    if (layoutMode === 'grid4x5') {
      // 4 columns x 5 rows
      // In duplex print (flip on long edge), mirror each row's 4 columns:
      // [0, 1, 2, 3] -> [3, 2, 1, 0]
      const mirrored: { item: Vocab | null; originalIndex: number }[] = [];
      const cols = 4;
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originalCol = cols - 1 - c;
          const origIdx = r * cols + originalCol;
          mirrored.push({
            item: slots[origIdx],
            originalIndex: origIdx,
          });
        }
      }
      return mirrored;
    } else {
      // 2 columns x 10 rows
      // Mirror each row's 2 columns:
      // [0, 1] -> [1, 0]
      const mirrored: { item: Vocab | null; originalIndex: number }[] = [];
      const cols = 2;
      const rows = 10;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originalCol = cols - 1 - c;
          const origIdx = r * cols + originalCol;
          mirrored.push({
            item: slots[origIdx],
            originalIndex: origIdx,
          });
        }
      }
      return mirrored;
    }
  }, [slots, duplexMode, layoutMode]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Printer className="w-3.5 h-3.5" /> Chuẩn in A4 • 2 trang
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Sparkles className="w-3.5 h-3.5" /> Tối đa 20 từ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            In Thẻ & Phiếu Học Từ Vựng
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Format tự động căn chỉnh <strong className="text-slate-800">luôn luôn đúng 2 trang A4</strong>:{' '}
            <span className="text-indigo-600 font-semibold">Trang 1 chỉ chứa Hán ngữ</span> và{' '}
            <span className="text-emerald-600 font-semibold">Trang 2 chứa Hán ngữ, Pinyin & Tiếng Việt</span>. Hỗ trợ ghép đôi 2 mặt khi in và cắt thành flashcard cầm tay.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3 shrink-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
            >
              Về danh sách
            </button>
          )}

          <button
            onClick={handlePrint}
            disabled={selectedVocabList.length === 0}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            title="In ra máy in hoặc Lưu dưới dạng file PDF"
          >
            <Printer className="w-5 h-5 text-white animate-pulse" />
            <span>IN 2 TRANG NGAY</span>
          </button>
        </div>
      </div>

      {/* Warning message if user selects more than 20 */}
      {warningMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-800 text-sm flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="p-1 rounded-lg hover:bg-amber-100 text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls & Layout Options Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Counter with Visual Progress Bar */}
          <div className="space-y-1.5 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                Số từ đã chọn:
              </span>
              <span className="font-mono text-indigo-600 font-extrabold text-sm">
                {selectedVocabList.length} / {MAX_PRINT_WORDS} từ
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  selectedVocabList.length === MAX_PRINT_WORDS
                    ? 'bg-emerald-500'
                    : selectedVocabList.length > 0
                    ? 'bg-indigo-600'
                    : 'bg-slate-300'
                }`}
                style={{ width: `${(selectedVocabList.length / MAX_PRINT_WORDS) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick selection actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSelectFirst20}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Chọn nhanh 20 từ đầu tiên"
            >
              <Check className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chọn 20 từ đầu</span>
            </button>

            <button
              onClick={handleSelectRandom20}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Chọn ngẫu nhiên 20 từ"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-600" />
              <span>Chọn 20 từ ngẫu nhiên</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                title="Bỏ chọn toàn bộ"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>Bỏ chọn ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Layout Customization Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Duplex column flip toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white cursor-pointer transition-all">
            <div className="space-y-0.5 pr-2">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Khớp in 2 mặt giấy
              </span>
              <p className="text-[11px] text-slate-500">Đảo cột trang 2 để cắt thẻ khớp 100%</p>
            </div>
            <input
              type="checkbox"
              checked={duplexMode}
              onChange={(e) => setDuplexMode(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          {/* Layout mode: 4x5 or 2x10 */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70">
            <div className="space-y-0.5 pr-2">
              <span className="font-bold text-slate-800">Kiểu khung 20 ô:</span>
              <p className="text-[11px] text-slate-500">
                {layoutMode === 'grid4x5' ? 'Lưới thẻ 4×5 (cắt rời)' : 'Bảng dòng 2×10'}
              </p>
            </div>
            <div className="flex bg-slate-200 p-0.5 rounded-xl">
              <button
                onClick={() => setLayoutMode('grid4x5')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  layoutMode === 'grid4x5' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
                title="4 cột x 5 hàng (Chuẩn flashcard)"
              >
                4×5
              </button>
              <button
                onClick={() => setLayoutMode('list2x10')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  layoutMode === 'list2x10' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
                title="2 cột x 10 hàng"
              >
                2×10
              </button>
            </div>
          </div>

          {/* Cut guide lines toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white cursor-pointer transition-all">
            <div className="space-y-0.5 pr-2">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-amber-600" /> Viền nét đứt cắt kéo
              </span>
              <p className="text-[11px] text-slate-500">Hỗ trợ đường kẻ khi dùng kéo cắt</p>
            </div>
            <input
              type="checkbox"
              checked={showCutGuides}
              onChange={(e) => setShowCutGuides(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          {/* Page header and numbering toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white cursor-pointer transition-all">
            <div className="space-y-0.5 pr-2">
              <span className="font-bold text-slate-800">Số thứ tự & Tiêu đề</span>
              <p className="text-[11px] text-slate-500">Hiển thị #1-#20 và tiêu đề trang</p>
            </div>
            <input
              type="checkbox"
              checked={showIndexNumber}
              onChange={(e) => {
                setShowIndexNumber(e.target.checked);
                setShowPageHeaders(e.target.checked);
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>

        {/* Selected words chips summary */}
        {selectedVocabList.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">
                Danh sách từ sẽ in ({selectedVocabList.length}/20):
              </span>
              <span className="text-[11px] text-slate-400">Nhấn dấu [×] trên từ để gỡ bỏ</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-100">
              {selectedVocabList.map((v, i) => (
                <span
                  key={v.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs font-medium"
                >
                  <span className="text-[10px] text-indigo-500 font-mono font-bold">#{i + 1}</span>
                  <span
                    className="font-bold text-slate-900"
                    style={{ fontFamily: '"Noto Sans SC", "KaiTi", "PingFang SC", sans-serif' }}
                  >
                    {v.hanzi}
                  </span>
                  <button
                    onClick={() => handleToggleWord(v.id)}
                    className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-colors"
                    title={`Gỡ từ ${v.hanzi}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Split: Word Selector on Left & Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Word Selector Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-indigo-600" />
              Chọn từ vựng để in
            </h2>
            <span className="text-xs text-slate-500">
              {filteredVocab.length} từ khả dụng
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Hán tự, Pinyin, nghĩa..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bucket Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {(['all', 'unremembered', 'temporary', 'warehouse', 'flashcard'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBucketFilter(b)}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all ${
                  bucketFilter === b
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {b === 'all' ? 'Tất cả' : memoryBucketLabel(b as MemoryBucket)}
              </button>
            ))}
          </div>

          {/* Vocabulary Selectable List */}
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredVocab.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Không tìm thấy từ nào phù hợp.
              </div>
            ) : (
              filteredVocab.map((w) => {
                const isSelected = selectedIds.includes(w.id);
                const orderIndex = selectedIds.indexOf(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => handleToggleWord(w.id)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 text-indigo-600">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                            {orderIndex + 1}
                          </div>
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold text-base text-slate-900"
                            style={{
                              fontFamily: '"Noto Sans SC", "KaiTi", "PingFang SC", sans-serif',
                            }}
                          >
                            {w.hanzi}
                          </span>
                          <span className="text-xs text-indigo-500 font-mono truncate">
                            {w.pinyin}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">{w.meaning}</p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${memoryBucketColor(
                          w.memory_bucket
                        )}`}
                      >
                        {memoryBucketLabel(w.memory_bucket)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive A4 Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Xem trước tài liệu in (A4)</h2>
            </div>

            {/* Preview switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPreviewTab('both')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  previewTab === 'both'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả 2 trang
              </button>
              <button
                onClick={() => setPreviewTab('page1')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  previewTab === 'page1'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Trang 1 (Hán ngữ)
              </button>
              <button
                onClick={() => setPreviewTab('page2')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  previewTab === 'page2'
                    ? 'bg-white text-emerald-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Trang 2 (Hán ngữ, Pinyin & Nghĩa)
              </button>
            </div>
          </div>

          {/* Live Preview Paper Canvas Container */}
          <div className="bg-slate-100/80 p-3 sm:p-5 rounded-2xl overflow-y-auto max-h-[750px] space-y-6 flex flex-col items-center">
            {/* Page 1 Preview (Only Hanzi) */}
            {(previewTab === 'both' || previewTab === 'page1') && (
              <div className="w-full max-w-[560px] bg-white rounded-xl shadow-md border border-slate-300 p-4 sm:p-6 transition-all aspect-[1/1.414] flex flex-col justify-between">
                <div>

                  {/* Page 1 Grid (20 cells) */}
                  <div
                    className={`grid gap-1.5 sm:gap-2 ${
                      layoutMode === 'grid4x5' ? 'grid-cols-4 grid-rows-5' : 'grid-cols-2 grid-rows-10'
                    }`}
                  >
                    {slots.map((item, idx) => (
                      <div
                        key={`p1-${idx}`}
                        className={`relative rounded-lg flex flex-col items-center justify-center p-1.5 sm:p-2 transition-all ${
                          layoutMode === 'grid4x5' ? 'aspect-square min-h-[58px] sm:min-h-[78px]' : 'min-h-[38px] sm:min-h-[44px]'
                        } ${
                          showCutGuides
                            ? 'border-2 border-dashed border-slate-300 hover:border-indigo-400'
                            : 'border border-slate-200'
                        } ${item ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        {showIndexNumber && (
                          <span className="absolute top-1 left-1 text-[9px] font-mono text-slate-400 font-semibold select-none">
                            #{idx + 1}
                          </span>
                        )}

                        {item ? (
                          <span
                            className="font-extrabold text-slate-900 select-none text-center leading-none"
                            style={{
                              fontFamily: '"Noto Sans SC", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
                              fontSize:
                                layoutMode === 'grid4x5'
                                  ? item.hanzi.length <= 2
                                    ? '22px'
                                    : item.hanzi.length <= 4
                                    ? '17px'
                                    : '14px'
                                  : '18px',
                            }}
                          >
                            {item.hanzi}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic select-none">
                            Ô trống #{idx + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Page 2 Preview (Hanzi + Pinyin + Vietnamese) */}
            {(previewTab === 'both' || previewTab === 'page2') && (
              <div className="w-full max-w-[560px] bg-white rounded-xl shadow-md border border-slate-300 p-4 sm:p-6 transition-all aspect-[1/1.414] flex flex-col justify-between">
                <div>

                  {/* Page 2 Grid (20 cells) */}
                  <div
                    className={`grid gap-1.5 sm:gap-2 ${
                      layoutMode === 'grid4x5' ? 'grid-cols-4 grid-rows-5' : 'grid-cols-2 grid-rows-10'
                    }`}
                  >
                    {page2Slots.map(({ item, originalIndex }, idx) => (
                      <div
                        key={`p2-${idx}`}
                        className={`relative rounded-lg flex flex-col justify-center p-1.5 sm:p-2 transition-all ${
                          layoutMode === 'grid4x5'
                            ? 'aspect-square min-h-[58px] sm:min-h-[78px] text-center'
                            : 'min-h-[38px] sm:min-h-[44px]'
                        } ${
                          showCutGuides
                            ? 'border-2 border-dashed border-slate-300 hover:border-emerald-400'
                            : 'border border-slate-200'
                        } ${item ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        {showIndexNumber && (
                          <span className="absolute top-1 left-1 text-[9px] font-mono text-slate-400 font-semibold select-none">
                            #{originalIndex + 1}
                          </span>
                        )}

                        {item ? (
                          layoutMode === 'grid4x5' ? (
                            <div className="flex flex-col items-center justify-center gap-0.5 pt-1 w-full">
                              {/* 1. Hán ngữ */}
                              <span
                                className="font-extrabold text-slate-900 select-none leading-tight"
                                style={{
                                  fontFamily: '"Noto Sans SC", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
                                  fontSize:
                                    item.hanzi.length <= 2 ? '16px' : item.hanzi.length <= 4 ? '13px' : '11px',
                                }}
                              >
                                {item.hanzi}
                              </span>
                              {/* 2. Pinyin */}
                              <span className="text-[10px] font-semibold text-indigo-600 font-mono leading-none truncate w-full">
                                {item.pinyin}
                              </span>
                              {/* 3. Tiếng Việt */}
                              <span className="text-[9px] text-slate-700 leading-tight line-clamp-2 px-0.5">
                                {item.meaning}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 px-1 text-left">
                              <span
                                className="font-extrabold text-slate-900 select-none shrink-0"
                                style={{
                                  fontFamily: '"Noto Sans SC", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
                                  fontSize: '15px',
                                }}
                              >
                                {item.hanzi}
                              </span>
                              <span className="text-[11px] font-semibold text-indigo-600 font-mono shrink-0">
                                {item.pinyin}
                              </span>
                              <span className="text-[10px] text-slate-700 truncate text-right">
                                {item.meaning}
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-300 italic select-none text-center">
                            Ô trống #{originalIndex + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        PRINTABLE DOCUMENT COMPONENT 
        Using React Portal to mount directly into document.body.
        Hidden on screen, but @media print strictly isolates it and renders exactly 2 pages.
      */}
      {createPortal(
        <div id="printable-document" className="hidden print:block">
          {/* ────── PAGE 1: ONLY HANZI (CHỈ CHỨA HÁN NGỮ) ────── */}
          <div className="print-page print-page-1">
            {/* Grid 20 slots for Page 1 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: layoutMode === 'grid4x5' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                gridTemplateRows: layoutMode === 'grid4x5' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)',
                gap: '3mm',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              {slots.map((item, idx) => (
                <div
                  key={`print-p1-${idx}`}
                  style={{
                    position: 'relative',
                    border: showCutGuides ? '1.5px dashed #94a3b8' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2mm',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {showIndexNumber && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '1.5mm',
                        left: '2mm',
                        fontSize: '8pt',
                        fontFamily: 'monospace',
                        color: '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      #{idx + 1}
                    </span>
                  )}

                  {item ? (
                    <span
                      style={{
                        fontFamily:
                          '"Noto Sans SC", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
                        fontWeight: 700,
                        color: '#000000',
                        textAlign: 'center',
                        lineHeight: 1,
                        fontSize:
                          layoutMode === 'grid4x5'
                            ? item.hanzi.length <= 2
                              ? '34pt'
                              : item.hanzi.length <= 4
                              ? '25pt'
                              : '18pt'
                            : '26pt',
                      }}
                    >
                      {item.hanzi}
                    </span>
                  ) : (
                    <span style={{ fontSize: '9pt', color: '#cbd5e1', fontStyle: 'italic' }}>
                      #{idx + 1} Ô trống
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ────── PAGE 2: HANZI + PINYIN + VIETNAMESE (HÁN NGỮ, PINYIN VÀ TIẾNG VIỆT) ────── */}
          <div className="print-page print-page-2">
            {/* Grid 20 slots for Page 2 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: layoutMode === 'grid4x5' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                gridTemplateRows: layoutMode === 'grid4x5' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)',
                gap: '3mm',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              {page2Slots.map(({ item, originalIndex }, idx) => (
                <div
                  key={`print-p2-${idx}`}
                  style={{
                    position: 'relative',
                    border: showCutGuides ? '1.5px dashed #94a3b8' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2.5mm',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    textAlign: 'center',
                  }}
                >
                  {showIndexNumber && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '1.5mm',
                        left: '2mm',
                        fontSize: '8pt',
                        fontFamily: 'monospace',
                        color: '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      #{originalIndex + 1}
                    </span>
                  )}

                  {item ? (
                    layoutMode === 'grid4x5' ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '1.5mm',
                          width: '100%',
                        }}
                      >
                        {/* 1. Hán ngữ */}
                        <span
                          style={{
                            fontFamily:
                              '"Noto Sans SC", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
                            fontWeight: 700,
                            color: '#000000',
                            lineHeight: 1,
                            fontSize:
                              item.hanzi.length <= 2 ? '20pt' : item.hanzi.length <= 4 ? '15pt' : '12pt',
                          }}
                        >
                          {item.hanzi}
                        </span>
                        {/* 2. Pinyin */}
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '10.5pt',
                            color: '#4338ca',
                            lineHeight: 1.1,
                          }}
                        >
                          {item.pinyin}
                        </span>
                        {/* 3. Tiếng Việt */}
                        <span
                          style={{
                            fontSize: '9pt',
                            color: '#1e293b',
                            lineHeight: 1.25,
                            fontWeight: 500,
                            padding: '0 1mm',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.meaning}
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '0 2mm',
                        }}
                      >
                        <span
                          style={{
                            fontFamily:
                              '"Noto Sans SC", "KaiTi", "PingFang SC", "Microsoft YaHei", sans-serif',
                            fontWeight: 700,
                            color: '#000000',
                            fontSize: '18pt',
                          }}
                        >
                          {item.hanzi}
                        </span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '12pt',
                            color: '#4338ca',
                          }}
                        >
                          {item.pinyin}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5pt',
                            color: '#1e293b',
                            fontWeight: 500,
                            maxWidth: '50%',
                            textAlign: 'right',
                          }}
                        >
                          {item.meaning}
                        </span>
                      </div>
                    )
                  ) : (
                    <span style={{ fontSize: '9pt', color: '#cbd5e1', fontStyle: 'italic' }}>
                      #{originalIndex + 1} Ô trống
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
