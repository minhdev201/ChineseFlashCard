import { useMemo, useState } from 'react';
import { Search, Volume2, Pencil, Trash2, X, AlertTriangle, Copy, Check, FileText } from 'lucide-react';
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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vocab;
    return vocab.filter((v) =>
      [v.hanzi, v.pinyin, v.meaning]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    );
  }, [vocab, query]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo Hán tự, Pinyin hoặc nghĩa..."
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

      {/* Header Info & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm font-semibold text-slate-600">
          Hiển thị {filtered.length} / {vocab.length} từ vựng
        </p>

        {vocab.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text = (query ? filtered : vocab).map((v) => v.hanzi.trim()).filter(Boolean).join(', ');
                navigator.clipboard.writeText(text);
                setQuickCopied(true);
                setTimeout(() => setQuickCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Sao chép nhanh danh sách Hán tự cách nhau bởi dấu phẩy"
            >
              {quickCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Copy Hán tự (,)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200"
              title="Mở bảng xem và xuất danh sách Hán tự"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xem danh sách xuất</span>
            </button>
          </div>
        )}
      </div>

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

      {/* Export Hanzi Modal */}
      {exportModalOpen && (
        <ExportHanziModal
          vocab={vocab}
          filtered={filtered}
          hasQuery={Boolean(query.trim())}
          onClose={() => setExportModalOpen(false)}
        />
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
  const [meaning, setMeaning] = useState(vocab.meaning);
  const [structure, setStructure] = useState(vocab.structure || '');

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
          <EditField label="Nghĩa tiếng Việt">
            <input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </EditField>
          <EditField label="Cấu trúc ngữ pháp">
            <textarea
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              placeholder={`Công thức (dòng 1) + Ví dụ (các dòng sau)`}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none text-sm leading-relaxed"
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
                meaning: meaning.trim(),
                structure: structure.trim() || null,
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

function ExportHanziModal({
  vocab,
  filtered,
  hasQuery,
  onClose,
}: {
  vocab: Vocab[];
  filtered: Vocab[];
  hasQuery: boolean;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<'all' | 'filtered'>(hasQuery ? 'filtered' : 'all');
  const [copied, setCopied] = useState(false);

  const targetList = scope === 'filtered' && hasQuery ? filtered : vocab;
  const hanziListString = useMemo(() => {
    return targetList
      .map((v) => v.hanzi.trim())
      .filter(Boolean)
      .join(', ');
  }, [targetList]);

  const handleCopy = () => {
    navigator.clipboard.writeText(hanziListString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl animate-pop border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Xuất danh sách Hán tự</h3>
              <p className="text-xs text-slate-500">Chỉ gồm các chữ Hán cách nhau bởi dấu phẩy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3 flex-1 overflow-y-auto">
          {hasQuery && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setScope('filtered')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  scope === 'filtered'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang tìm kiếm ({filtered.length} từ)
              </button>
              <button
                onClick={() => setScope('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  scope === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({vocab.length} từ)
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Định dạng: Chữ Hán, cách nhau bởi dấu phẩy (", ")</span>
              <span className="font-mono text-indigo-600 font-bold">{targetList.length} từ</span>
            </div>

            <textarea
              readOnly
              value={hanziListString}
              rows={8}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-base leading-relaxed outline-none focus:border-indigo-400 focus:bg-white transition-all select-all resize-none font-medium"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold transition-all shadow-md shadow-indigo-500/20 text-sm flex items-center justify-center gap-2 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Đã sao chép thành công!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>Sao chép tất cả ({targetList.length} từ)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
