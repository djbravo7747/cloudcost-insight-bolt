import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AlertThresholds } from '@/types';
import type { PageKey } from '@/config/navigation';
import { DEFAULT_BILLING_MONTH } from '@/data/sampleCatalog';

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = { warningPercent: 80, criticalPercent: 100 };

interface AppStateValue {
  page: PageKey;
  navigate: (page: PageKey) => void;
  billingMonth: string;
  setBillingMonth: (month: string) => void;
  projectFilter: string;
  setProjectFilter: (projectId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  alertThresholds: AlertThresholds;
  saveAlertThresholds: (thresholds: AlertThresholds) => void;
  mutedBudgetIds: string[];
  toggleBudgetAlert: (budgetId: string) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageKey>('overview');
  const [billingMonth, setBillingMonth] = useState(DEFAULT_BILLING_MONTH);
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertThresholds, setAlertThresholds] = useState<AlertThresholds>(DEFAULT_ALERT_THRESHOLDS);
  const [mutedBudgetIds, setMutedBudgetIds] = useState<string[]>([]);

  const navigate = useCallback((next: PageKey) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  const toggleBudgetAlert = useCallback((budgetId: string) => {
    setMutedBudgetIds((current) =>
      current.includes(budgetId) ? current.filter((id) => id !== budgetId) : [...current, budgetId],
    );
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      page,
      navigate,
      billingMonth,
      setBillingMonth,
      projectFilter,
      setProjectFilter,
      searchQuery,
      setSearchQuery,
      alertThresholds,
      saveAlertThresholds: setAlertThresholds,
      mutedBudgetIds,
      toggleBudgetAlert,
    }),
    [page, navigate, billingMonth, projectFilter, searchQuery, alertThresholds, mutedBudgetIds, toggleBudgetAlert],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
