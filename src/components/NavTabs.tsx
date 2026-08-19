import { LayoutGrid, PlusCircle, Library, BarChart3, Network } from 'lucide-react';
import type { TabKey } from '@/lib/types';

interface NavTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'flashcard', label: 'Flashcard', icon: LayoutGrid },
  { key: 'add', label: 'Thêm từ', icon: PlusCircle },
  { key: 'list', label: 'Danh sách', icon: Library },
  { key: 'network', label: 'Mạng từ', icon: Network },
  { key: 'stats', label: 'Thống kê', icon: BarChart3 },
];

export function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="sticky top-[57px] z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-2 sm:px-6">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onChange(t.key)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
