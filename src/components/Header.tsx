import { Flame, BookOpen, LogOut } from 'lucide-react';

interface HeaderProps {
  streak: number;
  totalWords: number;
  email?: string | null;
  onSignOut?: () => void;
}

export function Header({ streak, totalWords, email, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <span className="text-white text-xl font-bold">汉</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              Học Từ Vựng Tiếng Trung
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {email || 'Flashcard chuyển đổi · Chưa nhớ · Tạm nhớ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200"
            title="Chuỗi ngày học"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-flame" />
            <span className="text-sm font-bold text-orange-600">{streak}</span>
            <span className="text-xs text-orange-500 hidden sm:inline">ngày</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200"
            title="Tổng số từ"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-indigo-600">{totalWords}</span>
            <span className="text-xs text-indigo-500 hidden sm:inline">từ</span>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Thoát</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
