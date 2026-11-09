import { useState, type ReactNode } from 'react';
import { useAppState } from '@/context/AppStateContext';
import type { PageKey } from '@/config/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { page, navigate } = useAppState();
  const [navOpen, setNavOpen] = useState(false);

  const handleNavigate = (next: PageKey) => {
    navigate(next);
    setNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar activePage={page} open={navOpen} onNavigate={handleNavigate} onClose={() => setNavOpen(false)} />
      <div className="md:pl-64">
        <TopBar onOpenNav={() => setNavOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
