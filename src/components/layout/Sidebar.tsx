import { Cloud, X } from 'lucide-react';
import { NAV_ITEMS, type PageKey } from '@/config/navigation';

interface SidebarProps {
  activePage: PageKey;
  open: boolean;
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}

export function Sidebar({ activePage, open, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-navy-100 transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
              <Cloud className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white">CloudCost Insight</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1 text-navy-300 hover:bg-navy-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = item.key === activePage;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active
                    ? 'bg-navy-700 text-white shadow-inner'
                    : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sky-300' : 'text-navy-300'}`} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-5 text-xs text-navy-300">Sample data demo</div>
      </aside>
    </>
  );
}
