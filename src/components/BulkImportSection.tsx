import { useState, useMemo } from 'react';
import {
  Upload,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { parseBulkVocab, type ParsedVocabItem } from '@/lib/bulkImportParser';
import type { Vocab } from '@/lib/types';

interface BulkImportSectionProps {
  onBulkAdd: (
    items: Array<{
      hanzi: string;
      pinyin: string;
      meaning: string;
      structure?: string | null;
    }>
  ) => Promise<unknown>;
  existingVocab: Vocab[];
}

const SAMPLE_DATA = `就在附近 | jiù zài fùjìn | ngay ở gần đây
找不到 | zhǎo bu dào | tìm không thấy / không tìm được (bổ ngữ khả năng dạng phủ định)
怎么找不到了呢 | zěnme zhǎo bu dào le ne | sao lại không tìm thấy nữa rồi nhỉ?
别着急 | bié zháojí | đừng sốt ruột / đừng cuống
再看看 | zài kànkan | xem lại xem / nhìn lại một chút`;

const AI_PROMPT_TEMPLATE = `Hãy lọc danh sách từ vựng/cụm từ tiếng Trung trong đoạn văn sau theo đúng định dạng sau:
Hán ngữ | pinyin | nghĩa tiếng việt

Yêu cầu:
- Mỗi từ hoặc cụm từ nằm trên một dòng riêng.
- Sử dụng dấu gạch đứng | để phân cách 3 trường.
- Không đánh số thứ tự đầu dòng (1., 2.).
- Không thêm lời chào, giải thích hoặc ký tự thừa.

Đoạn văn:
[DÁN ĐOẠN VĂN CỦA BẠN VÀO ĐÂY]`;

export function BulkImportSection({ onBulkAdd, existingVocab }: BulkImportSectionProps) {
  const [rawText, setRawText] = useState('');
  const [skipExisting, setSkipExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Parse text live
  const parseResult = useMemo(() => {
    return parseBulkVocab(rawText, existingVocab);
  }, [rawText, existingVocab]);

  // Items that will actually be imported
  const itemsToImport = useMemo(() => {
    return parseResult.items.filter((item) => {
      if (item.status === 'error') return false;
      if (item.status === 'duplicate_batch') return false;
      if (skipExisting && item.status === 'duplicate_store') return false;
      return true;
    });
  }, [parseResult.items, skipExisting]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleInsertSample = () => {
    setRawText(SAMPLE_DATA);
    setSuccessInfo(null);
    setErrorMessage('');
  };

  const handleClear = () => {
    setRawText('');
    setSuccessInfo(null);
    setErrorMessage('');
  };

  const handleDeleteRow = (itemToDelete: ParsedVocabItem) => {
    const lines = rawText.split(/\r?\n/);
    const lineIndex = itemToDelete.lineNumber - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines.splice(lineIndex, 1);
      setRawText(lines.join('\n'));
    }
  };

  const handleImport = async () => {
    if (itemsToImport.length === 0) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessInfo(null);

    try {
      await onBulkAdd(
        itemsToImport.map((i) => ({
          hanzi: i.hanzi,
          pinyin: i.pinyin,
          meaning: i.meaning,
        }))
      );
      setSuccessInfo({ count: itemsToImport.length });
      setRawText('');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể thêm danh sách từ vựng. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Helper & AI Prompt Shortcut */}
      <div className="bg-gradient-to-r from-indigo-900/5 via-indigo-600/5 to-blue-600/5 border border-indigo-100 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                AI
              </span>
              <h3 className="font-semibold text-slate-800 text-base">
                Cấu trúc: <code className="bg-white px-2 py-0.5 rounded text-indigo-700 font-mono text-sm border border-indigo-200">hán ngữ | pinyin | nghĩa tiếng việt</code>
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Mỗi dòng là một từ. Copy trực tiếp từ ChatGPT, Claude, Gemini hoặc DeepSeek dán vào bên dưới.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition shadow-sm"
              title="Sao chép câu lệnh mẫu để gửi cho AI"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Đã chép prompt!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt cho AI</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleInsertSample}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 border border-transparent text-indigo-700 hover:bg-indigo-100 text-xs font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dán ví dụ mẫu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Nhập danh sách từ vựng
          </label>
          {rawText && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa ô nhập
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setSuccessInfo(null);
            }}
            placeholder={`就在附近 | jiù zài fùjìn | ngay ở gần đây\n\n找不到 | zhǎo bu dào | tìm không thấy / không tìm được (bổ ngữ khả năng dạng phủ định)\n\n怎么找不到了呢 | zěnme zhǎo bu dào le ne | sao lại không tìm thấy nữa rồi nhỉ?\n\n别着急 | bié zháojí | đừng sốt ruột / đừng cuống\n\n再看看 | zài kànkan | xem lại xem / nhìn lại một chút`}
            rows={10}
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white font-mono text-sm leading-relaxed text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition shadow-sm placeholder:text-slate-300 resize-y min-h-[220px]"
          />
        </div>
      </div>

      {/* Options & Settings */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs sm:text-sm text-slate-700">
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipExisting}
              onChange={(e) => setSkipExisting(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="font-medium">Bỏ qua từ đã có trong kho</span>
          </label>
        </div>

        {parseResult.items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Tổng phát hiện: <b className="text-slate-800">{parseResult.items.length}</b> dòng
            </span>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-900">
              Đã thêm thành công {successInfo.count} từ vào kho từ vựng!
            </p>
            <p className="text-xs text-emerald-700">
              Các từ đã được đồng bộ vào cơ sở dữ liệu và sẵn sàng để luyện tập trên Flashcard.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Live Preview Table */}
      {parseResult.items.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span>Bảng xem trước & kiểm tra</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                {itemsToImport.length} từ sẽ nhập
              </span>
            </h4>

            <div className="flex items-center gap-2 text-xs">
              {parseResult.storeDuplicateCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                  {parseResult.storeDuplicateCount} từ đã có
                </span>
              )}
              {parseResult.errorCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
                  {parseResult.errorCount} dòng lỗi
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5 w-36">Hán ngữ</th>
                  <th className="px-3 py-2.5 w-40">Pinyin</th>
                  <th className="px-3 py-2.5">Nghĩa tiếng Việt</th>
                  <th className="px-3 py-2.5 w-28 text-center">Trạng thái</th>
                  <th className="px-2 py-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parseResult.items.map((item, idx) => {
                  const isExcluded =
                    item.status === 'error' ||
                    item.status === 'duplicate_batch' ||
                    (skipExisting && item.status === 'duplicate_store');

                  return (
                    <tr
                      key={item.tempId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExcluded ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-xs text-slate-400 text-center">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 text-base" style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}>
                        {item.hanzi}
                      </td>
                      <td className="px-3 py-2.5 text-indigo-600 font-medium text-sm">
                        {item.pinyin}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 text-sm">
                        {item.meaning}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {item.status === 'valid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Mới
                          </span>
                        )}
                        {item.status === 'duplicate_store' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Đã có trong kho
                          </span>
                        )}
                        {item.status === 'duplicate_batch' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                            Trùng trong ds
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
                            title={item.errorMessage}
                          >
                            Lỗi format
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(item)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Bỏ qua dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={submitting || itemsToImport.length === 0}
          onClick={handleImport}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed text-base"
        >
          <Upload className="w-5 h-5" />
          {submitting
            ? 'Đang nhập từ vào kho...'
            : itemsToImport.length > 0
            ? `Thêm ${itemsToImport.length} từ vựng vào kho`
            : 'Vui lòng nhập danh sách từ vựng'}
        </button>
      </div>
    </div>
  );
}
