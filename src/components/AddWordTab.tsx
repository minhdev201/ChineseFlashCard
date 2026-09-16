import { useRef, useState } from 'react';
import { Plus, Check, AlertCircle, Layers, FileText } from 'lucide-react';
import { hasNumericTones, numericPinyinToMarked } from '@/lib/pinyin';
import type { Vocab } from '@/lib/types';
import { BulkImportSection } from './BulkImportSection';

interface AddWordTabProps {
  onAdd: (input: {
    hanzi: string;
    pinyin: string;
    meaning: string;
    structure?: string | null;
  }) => Promise<unknown>;
  onBulkAdd?: (
    items: Array<{
      hanzi: string;
      pinyin: string;
      meaning: string;
      structure?: string | null;
    }>
  ) => Promise<unknown>;
  isDuplicate: (hanzi: string) => Vocab | undefined;
  existingVocab?: Vocab[];
}

export function AddWordTab({ onAdd, onBulkAdd, isDuplicate, existingVocab = [] }: AddWordTabProps) {
  const [mode, setMode] = useState<'bulk' | 'single'>('bulk');
  const [hanzi, setHanzi] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [structure, setStructure] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dup, setDup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hanziRef = useRef<HTMLInputElement>(null);

  const handlePinyinChange = (val: string) => {
    setPinyin(val);
  };

  const handlePinyinBlur = () => {
    if (hasNumericTones(pinyin)) {
      setPinyin(numericPinyinToMarked(pinyin));
    }
  };

  const reset = () => {
    setHanzi('');
    setPinyin('');
    setMeaning('');
    setStructure('');
    setSuccess(false);
    setError('');
    setDup(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const h = hanzi.trim();
    const p = pinyin.trim();
    const m = meaning.trim();

    if (!h) {
      setError('Vui lòng nhập chữ Hán.');
      return;
    }
    if (!p) {
      setError('Vui lòng nhập Pinyin.');
      return;
    }
    if (!m) {
      setError('Vui lòng nhập nghĩa tiếng Việt.');
      return;
    }

    if (isDuplicate(h)) {
      setDup(true);
      return;
    }

    setSubmitting(true);
    try {
      const finalPinyin = hasNumericTones(p) ? numericPinyinToMarked(p) : p;
      await onAdd({
        hanzi: h,
        pinyin: finalPinyin,
        meaning: m,
        structure: structure.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        reset();
        hanziRef.current?.focus();
      }, 800);
    } catch {
      setError('Không thể thêm từ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 py-6 transition-all ${mode === 'bulk' ? 'max-w-4xl' : 'max-w-xl'}`}>
      {/* Tab Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thêm từ vựng</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {mode === 'bulk'
              ? 'Dán danh sách từ trích xuất từ AI theo định dạng Hán ngữ | pinyin | nghĩa'
              : 'Thêm thủ công từng từ vựng kèm mẫu câu ngữ pháp'}
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              mode === 'bulk'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Nhập hàng loạt (AI)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              mode === 'single'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Thêm từng từ</span>
          </button>
        </div>
      </div>

      {mode === 'bulk' ? (
        onBulkAdd ? (
          <BulkImportSection onBulkAdd={onBulkAdd} existingVocab={existingVocab} />
        ) : (
          <div className="text-sm text-slate-500">Chức năng nhập hàng loạt đang chuẩn bị...</div>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Hán tự" required>
          <input
            ref={hanziRef}
            type="text"
            value={hanzi}
            onChange={(e) => {
              setHanzi(e.target.value);
              setDup(false);
              setSuccess(false);
            }}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-lg"
            style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
            autoFocus
          />
        </Field>

        <Field label="Pinyin" required>
          <input
            type="text"
            value={pinyin}
            onChange={(e) => handlePinyinChange(e.target.value)}
            onBlur={handlePinyinBlur}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </Field>

        <Field label="Nghĩa tiếng Việt" required>
          <input
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </Field>

        <Field label="Cấu trúc ngữ pháp" hint="Tùy chọn">
          <textarea
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
            placeholder={`Dòng 1: công thức (vd: 谁的 + danh từ = ... của ai)\nDòng 2+: ví dụ (vd: 谁的书？→ Sách của ai?)`}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none text-sm leading-relaxed"
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {dup && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Từ "<span className="font-semibold">{hanzi.trim()}</span>" đã có trong bộ dữ liệu.
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 animate-pop">
            <Check className="w-4 h-4 shrink-0" />
            Đã thêm từ mới thành công!
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            <Plus className="w-5 h-5" />
            {submitting ? 'Đang thêm...' : 'Thêm từ'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Xóa form
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
