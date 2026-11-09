import type { ComponentType } from 'react';
import { AppStateProvider, useAppState } from '@/context/AppStateContext';
import type { PageKey } from '@/config/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { OverviewPage } from '@/pages/OverviewPage';
import { CostExplorerPage } from '@/pages/CostExplorerPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { SettingsPage } from '@/pages/SettingsPage';

const PAGES: Record<PageKey, ComponentType> = {
  overview: OverviewPage,
  'cost-explorer': CostExplorerPage,
  projects: ProjectsPage,
  resources: ResourcesPage,
  budgets: BudgetsPage,
  pipeline: PipelinePage,
  settings: SettingsPage,
};

function CurrentPage() {
  const { page } = useAppState();
  const Page = PAGES[page];
  return (
    <div key={page} className="animate-fade-in">
      <Page />
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppLayout>
        <CurrentPage />
      </AppLayout>
    </AppStateProvider>
  );
}

export default App;
