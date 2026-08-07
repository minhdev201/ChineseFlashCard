import { useRef, useState } from 'react';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { hasNumericTones, numericPinyinToMarked } from '@/lib/pinyin';
import type { Vocab } from '@/lib/types';

interface AddWordTabProps {
  onAdd: (input: {
    hanzi: string;
    pinyin: string;
    meaning: string;
  }) => Promise<unknown>;
  isDuplicate: (hanzi: string) => Vocab | undefined;
}

export function AddWordTab({ onAdd, isDuplicate }: AddWordTabProps) {
  const [hanzi, setHanzi] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Thêm từ</h2>
      </div>

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
