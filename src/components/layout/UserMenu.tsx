import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { DATA_SOURCE_LABEL } from '@/config/dataSource';

const USER = { name: 'Jordan Lee', role: 'FinOps Lead', initials: 'JL' };

export function UserMenu() {
  const { navigate } = useAppState();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 text-xs font-semibold text-white">
          {USER.initials}
        </span>
        <span className="hidden text-left lg:block">
          <span className="block text-sm font-medium text-slate-800">{USER.name}</span>
          <span className="block text-xs text-slate-500">{USER.role}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-fade-in"
        >
          <div className="px-3 py-2.5">
            <p className="text-sm font-medium text-slate-800">{USER.name}</p>
            <p className="text-xs text-slate-500">{USER.role}</p>
          </div>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              navigate('settings');
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Account settings
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-500">
            <UserCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {DATA_SOURCE_LABEL}
          </div>
          <div className="my-1 border-t border-slate-100" />
          <p className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign-in is not enabled in this demo
          </p>
        </div>
      )}
    </div>
  );
}
