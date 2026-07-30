import { useMemo, useState } from 'react';
import { Search, Volume2, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import type { Vocab } from '@/lib/types';
import { memoryBucketColor, memoryBucketLabel } from '@/lib/srs';
import { speak } from '@/lib/speech';
import { hasNumericTones, numericPinyinToMarked } from '@/lib/pinyin';

interface WordListTabProps {
  vocab: Vocab[];
  onUpdate: (id: string, patch: Partial<Vocab>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function WordListTab({ vocab, onUpdate, onDelete }: WordListTabProps) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Vocab | null>(null);
  const [deleting, setDeleting] = useState<Vocab | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vocab;
    return vocab.filter((v) =>
      [v.hanzi, v.pinyin, v.hanviet, v.meaning]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    );
  }, [vocab, query]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo Hán tự, Pinyin, Hán Việt hoặc nghĩa..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-3">
        {filtered.length} / {vocab.length} từ
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {vocab.length === 0 ? 'Chưa có từ nào.' : 'Không tìm thấy từ phù hợp.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow animate-fade-in"
            >
              <button
                onClick={() => speak(w.hanzi)}
                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0"
                title="Phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 items-center">
                <div className="min-w-0">
                  <span
                    className="text-lg font-bold text-slate-900 block truncate"
                    style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
                  >
                    {w.hanzi}
                  </span>
                </div>
                <div className="min-w-0 hidden sm:block">
                  <span className="text-sm text-indigo-500 truncate block">{w.pinyin}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-slate-700 truncate block">{w.meaning}</span>
                </div>
                <div className="min-w-0 hidden sm:flex items-center gap-2 justify-end">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${memoryBucketColor(w.memory_bucket)}`}>
                    {memoryBucketLabel(w.memory_bucket)}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    Cập nhật: {w.last_reviewed_at || 'Chưa ôn'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(w)}
                  className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleting(w)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          vocab={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await onUpdate(editing.id, patch);
            setEditing(null);
          }}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-pop">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xóa từ này?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Từ "<span className="font-semibold">{deleting.hanzi}</span>" sẽ bị xóa khỏi bộ dữ liệu. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  await onDelete(deleting.id);
                  setDeleting(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditModal({
  vocab,
  onClose,
  onSave,
}: {
  vocab: Vocab;
  onClose: () => void;
  onSave: (patch: Partial<Vocab>) => void;
}) {
  const [hanzi, setHanzi] = useState(vocab.hanzi);
  const [pinyin, setPinyin] = useState(vocab.pinyin);
  const [hanviet, setHanviet] = useState(vocab.hanviet || '');
  const [meaning, setMeaning] = useState(vocab.meaning);
  const [example, setExample] = useState(vocab.example || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-pop max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Sửa từ vựng</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <EditField label="Hán tự">
            <input
              value={hanzi}
              onChange={(e) => setHanzi(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-lg"
              style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
            />
          </EditField>
          <EditField label="Pinyin">
            <input
              value={pinyin}
              onChange={(e) => setPinyin(e.target.value)}
              onBlur={() => hasNumericTones(pinyin) && setPinyin(numericPinyinToMarked(pinyin))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </EditField>
          <EditField label="Âm Hán Việt">
            <input
              value={hanviet}
              onChange={(e) => setHanviet(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </EditField>
          <EditField label="Nghĩa tiếng Việt">
            <input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </EditField>
          <EditField label="Ví dụ / Ghi chú">
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </EditField>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() =>
              onSave({
                hanzi: hanzi.trim(),
                pinyin: pinyin.trim(),
                hanviet: hanviet.trim() || null,
                meaning: meaning.trim(),
                example: example.trim() || null,
              })
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
