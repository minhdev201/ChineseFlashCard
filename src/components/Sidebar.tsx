import { useState } from 'react';
import {
  LayoutGrid,
  Pin,
  SunMedium,
  PlusCircle,
  Library,
  BarChart3,
  Flame,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BookOpenCheck,
} from 'lucide-react';
import type { FlashcardSource, TabKey } from '@/lib/types';
import { memoryBucketLabel } from '@/lib/srs';

interface SidebarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  unrememberedCount: number;
  temporaryCount: number;
  streak: number;
  totalWords: number;
  email?: string | null;
  onSignOut?: () => void;
  activeSource: FlashcardSource;
  onShowAllFlashcards: () => void;
}

const TABS: { key: TabKey; label: string; icon: typeof LayoutGrid; description: string }[] = [
  { key: 'flashcard', label: 'Flashcard', icon: LayoutGrid, description: 'Luyện tập flashcard & gõ chữ' },
  { key: 'unremembered', label: 'Chưa nhớ', icon: Pin, description: 'Từ vựng cần ôn gắt gao' },
  { key: 'temporary', label: 'Tạm nhớ', icon: SunMedium, description: 'Từ vựng đang củng cố' },
  { key: 'add', label: 'Thêm từ', icon: PlusCircle, description: 'Thêm từ vựng mới vào kho' },
  { key: 'list', label: 'Danh sách', icon: Library, description: 'Quản lý & chỉnh sửa từ vựng' },
  { key: 'stats', label: 'Thống kê', icon: BarChart3, description: 'Báo cáo và tiến độ học' },
];

export function Sidebar({
  active,
  onChange,
  unrememberedCount,
  temporaryCount,
  streak,
  totalWords,
  email,
  onSignOut,
  activeSource,
  onShowAllFlashcards,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabSelect = (tab: TabKey) => {
    onChange(tab);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <span className="text-white text-xl font-extrabold tracking-wider">汉</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">
              Hán Ngữ Flashcard
            </h1>
            <p className="text-xs text-indigo-300 font-medium">Luyện nhớ & gõ tiếng Trung</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Summary Pills */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between gap-2">
        <div
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/70 border border-slate-700/60"
          title="Chuỗi ngày học liên tục"
        >
          <Flame className="w-4 h-4 text-orange-400 animate-flame" />
          <div className="text-left">
            <span className="block text-xs text-slate-400 font-medium">Chuỗi</span>
            <span className="text-sm font-bold text-orange-300">{streak} ngày</span>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/70 border border-slate-700/60"
          title="Tổng số từ vựng trong kho"
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <div className="text-left">
            <span className="block text-xs text-slate-400 font-medium">Kho từ</span>
            <span className="text-sm font-bold text-indigo-300">{totalWords} từ</span>
          </div>
        </div>
      </div>

      {/* Focused mode badge if activeSource !== 'all' */}
      {activeSource !== 'all' && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-200 text-xs">
          <div className="flex items-center justify-between mb-1 font-semibold text-indigo-300">
            <span>Chế độ ôn tập</span>
            <button
              onClick={onShowAllFlashcards}
              className="text-[11px] underline hover:text-white flex items-center gap-1"
            >
              <BookOpenCheck className="w-3 h-3" /> Tất cả
            </button>
          </div>
          <p className="text-slate-300 text-[11px]">
            Đang lọc danh sách: <span className="font-semibold text-white">{memoryBucketLabel(activeSource)}</span>
          </p>
        </div>
      )}

      {/* Main Navigation Items */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Menu Điều Hướng
        </p>

        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTabSelect(t.key)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <div className="text-left truncate">
                  <span className="block truncate">{t.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {t.key === 'unremembered' && unrememberedCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {unrememberedCount}
                  </span>
                )}
                {t.key === 'temporary' && temporaryCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {temporaryCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* User Footer Profile & SignOut */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium">Tài khoản</p>
            <p className="text-xs font-semibold text-slate-200 truncate" title={email || ''}>
              {email || 'NguoiDung@hanzi.app'}
            </p>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 transition-colors"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top bar for mobile screens */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
              汉
            </div>
            <span className="font-bold text-sm tracking-wide">Hán Ngữ Flashcard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-orange-400 bg-orange-950/50 border border-orange-800/40 px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5 animate-flame" /> {streak}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-950/50 border border-indigo-800/40 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3.5 h-3.5" /> {totalWords}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar overlay */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 shadow-xl z-20">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
