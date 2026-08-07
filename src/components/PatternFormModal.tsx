import { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import type { GrammarPattern, PatternExample } from '@/lib/types';

interface PatternFormModalProps {
  initialData?: GrammarPattern | null;
  onClose: () => void;
  onSave: (data: {
    pattern: string;
    meaning: string;
    note?: string | null;
    examples: PatternExample[];
  }) => Promise<void>;
}

export function PatternFormModal({ initialData, onClose, onSave }: PatternFormModalProps) {
  const [pattern, setPattern] = useState(initialData?.pattern || '');
  const [meaning, setMeaning] = useState(initialData?.meaning || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [examples, setExamples] = useState<PatternExample[]>(
    initialData?.examples?.length
      ? initialData.examples.map((ex) => ({ ...ex }))
      : [{ hanzi: '', pinyin: '', meaning: '' }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddExample = () => {
    setExamples((prev) => [...prev, { hanzi: '', pinyin: '', meaning: '' }]);
  };

  const handleRemoveExample = (idx: number) => {
    setExamples((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExampleChange = (idx: number, field: keyof PatternExample, val: string) => {
    setExamples((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: val } : ex))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const p = pattern.trim();
    const m = meaning.trim();

    if (!p) {
      setError('Vui lòng nhập công thức / tên cấu trúc (VD: 怎么 + động từ?)');
      return;
    }
    if (!m) {
      setError('Vui lòng nhập giải nghĩa của cấu trúc.');
      return;
    }

    // Filter valid examples
    const validExamples = examples
      .map((ex) => ({
        hanzi: ex.hanzi.trim(),
        pinyin: ex.pinyin.trim(),
        meaning: ex.meaning.trim(),
      }))
      .filter((ex) => ex.hanzi || ex.meaning);

    setSubmitting(true);
    try {
      await onSave({
        pattern: p,
        meaning: m,
        note: note.trim() || null,
        examples: validExamples,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Có lỗi xảy ra khi lưu mẫu câu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl animate-pop max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialData ? 'Chỉnh sửa Mẫu câu' : 'Thêm Mẫu câu Ngữ pháp Mới'}
              </h3>
              <p className="text-xs text-slate-500">Lưu trữ các cấu trúc, công thức và mẫu câu tiếng Trung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Cấu trúc / Công thức <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="VD: 怎么 + động từ?  hoặc  谁的 + danh từ?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base font-semibold text-indigo-950"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ý nghĩa / Cách dùng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="VD: Hỏi cách thức thực hiện hành động (như thế nào?)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ghi chú ngữ pháp thêm <span className="text-xs font-normal text-slate-400">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Thường dùng trong câu hỏi nghi vấn, đứng trước động từ chính"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>

          {/* Examples list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-800">
                Các câu ví dụ minh họa ({examples.length})
              </label>
              <button
                type="button"
                onClick={handleAddExample}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm ví dụ
              </button>
            </div>

            <div className="space-y-3">
              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 relative group space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                    <span>Ví dụ #{idx + 1}</span>
                    {examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExample(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa ví dụ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={ex.hanzi}
                        onChange={(e) => handleExampleChange(idx, 'hanzi', e.target.value)}
                        placeholder="Chữ Hán (VD: 这个汉字怎么读？)"
                        style={{ fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 text-sm font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={ex.pinyin}
                        onChange={(e) => handleExampleChange(idx, 'pinyin', e.target.value)}
                        placeholder="Pinyin (VD: Zhège hànzì zěnme dú?)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 text-sm text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={ex.meaning}
                      onChange={(e) => handleExampleChange(idx, 'meaning', e.target.value)}
                      placeholder="Dịch nghĩa tiếng Việt (VD: Chữ Hán này đọc thế nào?)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 text-sm text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold transition-all shadow-md shadow-indigo-500/20 text-sm disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : initialData ? 'Lưu thay đổi' : 'Tạo mẫu câu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
