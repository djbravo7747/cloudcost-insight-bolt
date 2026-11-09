import { useEffect, useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { NAV_ITEMS } from '@/config/navigation';
import { BILLING_MONTHS } from '@/data/sampleCatalog';
import { formatMonth } from '@/lib/format';
import { getProjects } from '@/services/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { SelectField } from '@/components/common/FormControls';
import { UserMenu } from '@/components/layout/UserMenu';

interface TopBarProps {
  onOpenNav: () => void;
}

export function TopBar({ onOpenNav }: TopBarProps) {
  const { page, billingMonth, setBillingMonth, projectFilter, setProjectFilter, searchQuery, setSearchQuery } =
    useAppState();
  const { data: projects } = useAsyncData(getProjects, []);
  const title = NAV_ITEMS.find((item) => item.key === page)?.label ?? 'Overview';
  const [draftSearch, setDraftSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(draftSearch), 200);
    return () => window.clearTimeout(timer);
  }, [draftSearch, setSearchQuery]);

  const periodOptions = [...BILLING_MONTHS].reverse().map((month) => ({ value: month, label: formatMonth(month) }));
  const projectOptions = [
    { value: 'all', label: 'All projects' },
    ...(projects ?? []).map((project) => ({ value: project.id, label: project.name })),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6 xl:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="mr-auto text-lg font-semibold text-slate-900">{title}</h1>
        <div className="flex flex-wrap items-end gap-3">
          <SelectField
            label="Billing period"
            value={billingMonth}
            options={periodOptions}
            onChange={setBillingMonth}
            className="min-w-36"
          />
          <SelectField
            label="Project"
            value={projectFilter}
            options={projectOptions}
            onChange={setProjectFilter}
            className="min-w-44"
          />
          <label className="relative flex min-w-48 flex-col gap-1 text-xs font-medium text-slate-500">
            Search
            <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Resources, projects, services"
              className="rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-normal text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </label>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
