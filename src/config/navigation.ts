import {
  FolderOpen,
  LayoutDashboard,
  Server,
  Settings,
  TrendingUp,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type PageKey =
  | 'overview'
  | 'cost-explorer'
  | 'projects'
  | 'resources'
  | 'budgets'
  | 'pipeline'
  | 'settings';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'cost-explorer', label: 'Cost Explorer', icon: TrendingUp },
  { key: 'projects', label: 'Projects', icon: FolderOpen },
  { key: 'resources', label: 'Resources', icon: Server },
  { key: 'budgets', label: 'Budgets', icon: Wallet },
  { key: 'pipeline', label: 'Data Pipeline', icon: Workflow },
  { key: 'settings', label: 'Settings', icon: Settings },
];
