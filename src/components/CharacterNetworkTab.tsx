import { useMemo, useState } from 'react';
import {
  Network,
  Volume2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Link2,
  Layers,
} from 'lucide-react';
import type { Vocab } from '@/lib/types';
import { useCharacterNetwork, type CharacterGroup } from '@/lib/useCharacterNetwork';
import { memoryBucketColor, memoryBucketLabel } from '@/lib/srs';
import { speak } from '@/lib/speech';

interface CharacterNetworkTabProps {
  vocab: Vocab[];
}

// ── Colour palette cycling for character chips ──────────────────────────────
const PALETTES = [
  { chip: 'bg-indigo-100 text-indigo-700 border-indigo-200', header: 'from-indigo-500 to-indigo-700', accent: 'text-indigo-600', ring: 'ring-indigo-300', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { chip: 'bg-violet-100 text-violet-700 border-violet-200', header: 'from-violet-500 to-violet-700', accent: 'text-violet-600', ring: 'ring-violet-300', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  { chip: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', header: 'from-fuchsia-500 to-fuchsia-700', accent: 'text-fuchsia-600', ring: 'ring-fuchsia-300', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { chip: 'bg-cyan-100 text-cyan-700 border-cyan-200', header: 'from-cyan-500 to-cyan-700', accent: 'text-cyan-600', ring: 'ring-cyan-300', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', header: 'from-emerald-500 to-emerald-700', accent: 'text-emerald-600', ring: 'ring-emerald-300', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { chip: 'bg-amber-100 text-amber-700 border-amber-200', header: 'from-amber-500 to-amber-700', accent: 'text-amber-600', ring: 'ring-amber-300', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { chip: 'bg-rose-100 text-rose-700 border-rose-200', header: 'from-rose-500 to-rose-700', accent: 'text-rose-600', ring: 'ring-rose-300', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  { chip: 'bg-teal-100 text-teal-700 border-teal-200', header: 'from-teal-500 to-teal-700', accent: 'text-teal-600', ring: 'ring-teal-300', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
];
function palette(index: number) {
  return PALETTES[index % PALETTES.length];
}

// ── Stat pill ───────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, color }: { icon: typeof Network; value: number; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <div>
        <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

// ── VocabRow – compact row inside an expanded group ─────────────────────────
function VocabRow({ word, highlightChar, accentClass }: { word: Vocab; highlightChar: string; accentClass: string }) {
  const renderHanzi = () =>
    word.hanzi.split('').map((ch, i) =>
      ch === highlightChar ? (
        <span key={i} className={`${accentClass} font-black`}>{ch}</span>
      ) : (
        <span key={i} className="text-slate-800">{ch}</span>
      )
    );

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group">
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span
          className="text-lg font-bold shrink-0"
          style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
        >
          {renderHanzi()}
        </span>
        <span className="text-xs text-indigo-500 font-medium truncate">{word.pinyin}</span>
        <span className="text-xs text-slate-500 truncate hidden sm:block">{word.meaning}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${memoryBucketColor(word.memory_bucket)}`}>
          {memoryBucketLabel(word.memory_bucket)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); speak(word.hanzi); }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
          title="Phát âm"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── CharacterGroupCard – one character = one expandable card ─────────────────
function CharacterGroupCard({
  group,
  paletteIndex,
  isExpanded,
  onToggle,
}: {
  group: CharacterGroup;
  paletteIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const p = palette(paletteIndex);

  return (
    <div
      className={`
        rounded-2xl border-2 overflow-hidden transition-all duration-300 bg-white
        ${isExpanded ? `border-slate-300 shadow-lg` : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}
      `}
    >
      {/* Card header – always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left group"
      >
        {/* Character badge */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.header} flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105`}>
          <span
            className="text-2xl font-black text-white"
            style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
          >
            {group.character}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${p.badge}`}>
              {group.words.length} từ liên kết
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {group.density} ký tự kết nối
            </span>
          </div>
          {/* Preview: first 3 words */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {group.words.slice(0, 4).map((w) => (
              <span
                key={w.id}
                className="text-sm font-semibold text-slate-700"
                style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
              >
                {w.hanzi}
              </span>
            ))}
            {group.words.length > 4 && (
              <span className="text-xs text-slate-400">+{group.words.length - 4} từ khác</span>
            )}
          </div>
        </div>

        {/* Expand icon */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-slate-100' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          {/* Divider */}
          <div className={`h-px bg-gradient-to-r ${p.header} opacity-20 mb-3`} />
          <div className="flex flex-col gap-1.5">
            {group.words.map((word) => (
              <VocabRow
                key={word.id}
                word={word}
                highlightChar={group.character}
                accentClass={p.accent}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────────────
export function CharacterNetworkTab({ vocab }: CharacterNetworkTabProps) {
  const { networkGroups, singletons, totalCharacters, totalLinks } = useCharacterNetwork(vocab);
  const [expandedChars, setExpandedChars] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSingletons, setShowSingletons] = useState(false);

  const toggleExpand = (char: string) => {
    setExpandedChars((prev) => {
      const next = new Set(prev);
      if (next.has(char)) next.delete(char);
      else next.add(char);
      return next;
    });
  };

  const expandAll = () => setExpandedChars(new Set(networkGroups.map((g) => g.character)));
  const collapseAll = () => setExpandedChars(new Set());

  // Filter by search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return networkGroups;
    const ql = q.toLowerCase();
    return networkGroups.filter((g) =>
      g.character.includes(q) ||
      g.words.some(
        (w) => w.hanzi.includes(q) || w.pinyin.toLowerCase().includes(ql) || w.meaning.toLowerCase().includes(ql)
      )
    );
  }, [networkGroups, searchQuery]);

  if (vocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
          <Network className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-700 text-lg">Kho từ đang trống</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Hãy thêm từ vựng vào kho. Mạng lưới sẽ tự động xuất hiện khi có từ dùng chung chữ Hán.
        </p>
      </div>
    );
  }

  if (networkGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="font-bold text-slate-700 text-lg">Chưa có liên kết nào</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Hiện tại mỗi từ dùng chữ Hán riêng biệt. Thêm nhiều từ hơn để tạo mạng lưới liên kết.
        </p>
        <p className="text-xs text-slate-400">Kho từ: {vocab.length} từ • {totalCharacters} chữ Hán</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Mạng lưới Chữ Hán</h2>
            <p className="text-xs text-slate-500">Tự động liên kết từ vựng qua ký tự dùng chung</p>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex flex-wrap gap-3">
        <StatPill icon={Layers} value={vocab.length} label="Từ trong kho" color="text-indigo-500" />
        <StatPill icon={Network} value={totalLinks} label="Nhóm liên kết" color="text-violet-500" />
        <StatPill icon={Link2} value={totalCharacters} label="Ký tự tìm thấy" color="text-cyan-500" />
        <StatPill icon={Sparkles} value={singletons.length} label="Chữ đơn lẻ" color="text-amber-500" />
      </div>

      {/* ── Search & controls ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc theo chữ Hán, pinyin hoặc nghĩa..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white outline-none
              focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm transition-all"
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
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={expandAll}
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200"
          >
            Mở tất cả
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* ── Result count ── */}
      {searchQuery && (
        <p className="text-sm text-slate-500 -mt-2">
          Tìm thấy <span className="font-bold text-slate-800">{filteredGroups.length}</span> nhóm liên kết
        </p>
      )}

      {/* ── Network groups grid ── */}
      {filteredGroups.length === 0 && searchQuery ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Không tìm thấy nhóm nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredGroups.map((group, idx) => (
            <CharacterGroupCard
              key={group.character}
              group={group}
              paletteIndex={idx}
              isExpanded={expandedChars.has(group.character)}
              onToggle={() => toggleExpand(group.character)}
            />
          ))}
        </div>
      )}

      {/* ── Singleton section (optional) ── */}
      {singletons.length > 0 && !searchQuery && (
        <div className="mt-2">
          <button
            onClick={() => setShowSingletons((s) => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors group"
          >
            {showSingletons ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{singletons.length} chữ Hán đơn lẻ</span>
            <span className="text-xs font-normal text-slate-400">(chỉ xuất hiện trong 1 từ)</span>
          </button>

          {showSingletons && (
            <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
              {singletons.map((g) => (
                <div
                  key={g.character}
                  title={`${g.words[0].hanzi} — ${g.words[0].meaning}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all cursor-default"
                >
                  <span
                    className="text-base font-bold text-slate-800"
                    style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
                  >
                    {g.character}
                  </span>
                  <span
                    className="text-xs text-slate-500"
                    style={{ fontFamily: '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
                  >
                    ({g.words[0].hanzi})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
