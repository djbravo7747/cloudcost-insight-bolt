import type {
  AlertThresholds,
  BillingRecord,
  Budget,
  BudgetStatus,
  Project,
  ReviewFlag,
  Resource,
  ServiceName,
} from '@/types';
import { getProjectName, getTagIssues } from '@/lib/tags';

export interface BillingFilter {
  billingMonth?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  service?: string;
}

export interface GroupedCost {
  key: string;
  cost: number;
}

export interface BudgetRow {
  budget: Budget;
  actual: number;
  variance: number;
  utilization: number;
  status: BudgetStatus;
}

export interface ResourceSummary {
  resource: Resource;
  projectId: string;
  projectName: string;
  cost: number;
  usage: number;
  usageUnit: string;
  flags: ReviewFlag[];
  ownershipStatus: 'Tagged' | 'Needs review';
}

export const UNUSUAL_COST_MULTIPLIER = 1.4;

export function filterBillingRecords(records: BillingRecord[], filter: BillingFilter): BillingRecord[] {
  return records.filter((record) => {
    if (filter.billingMonth && record.billingMonth !== filter.billingMonth) return false;
    if (filter.startDate && record.billingDate < filter.startDate) return false;
    if (filter.endDate && record.billingDate > filter.endDate) return false;
    if (filter.projectId && filter.projectId !== 'all' && record.projectId !== filter.projectId) return false;
    if (filter.service && filter.service !== 'all' && record.service !== filter.service) return false;
    return true;
  });
}

export function sumCost(records: BillingRecord[]): number {
  return records.reduce((total, record) => total + record.cost, 0);
}

export function groupCostBy(records: BillingRecord[], keyOf: (record: BillingRecord) => string): GroupedCost[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    const key = keyOf(record);
    totals.set(key, (totals.get(key) ?? 0) + record.cost);
  }
  return [...totals.entries()]
    .map(([key, cost]) => ({ key, cost: Math.round(cost * 100) / 100 }))
    .sort((a, b) => b.cost - a.cost);
}

export function monthlyCostSeries(records: BillingRecord[], months: string[]): { month: string; cost: number }[] {
  const totals = new Map<string, number>(months.map((month) => [month, 0]));
  for (const record of records) {
    if (totals.has(record.billingMonth)) {
      totals.set(record.billingMonth, (totals.get(record.billingMonth) ?? 0) + record.cost);
    }
  }
  return months.map((month) => ({ month, cost: Math.round((totals.get(month) ?? 0) * 100) / 100 }));
}

export function monthlyUsageAndCost(
  records: BillingRecord[],
  months: string[],
): { month: string; usage: number; cost: number }[] {
  return months.map((month) => {
    const monthRecords = records.filter((record) => record.billingMonth === month);
    return {
      month,
      usage: Math.round(monthRecords.reduce((total, record) => total + record.usageQuantity, 0)),
      cost: Math.round(sumCost(monthRecords)),
    };
  });
}

export function getBudgetStatus(utilization: number, thresholds: AlertThresholds): BudgetStatus {
  if (utilization >= thresholds.criticalPercent) return 'Over budget';
  if (utilization >= thresholds.warningPercent) return 'Warning';
  return 'On track';
}

export function buildBudgetRows(
  budgets: Budget[],
  records: BillingRecord[],
  billingMonth: string,
  thresholds: AlertThresholds,
): BudgetRow[] {
  const monthRecords = records.filter((record) => record.billingMonth === billingMonth);
  return budgets.map((budget) => {
    const actual = sumCost(
      monthRecords.filter((record) =>
        budget.scope === 'Project' ? record.projectId === budget.targetId : record.service === budget.targetId,
      ),
    );
    const utilization = budget.monthlyBudget > 0 ? (actual / budget.monthlyBudget) * 100 : 0;
    return {
      budget,
      actual,
      variance: actual - budget.monthlyBudget,
      utilization,
      status: getBudgetStatus(utilization, thresholds),
    };
  });
}

export function isUnusualCost(resourceRecords: BillingRecord[], billingMonth: string, months: string[]): boolean {
  const monthIndex = months.indexOf(billingMonth);
  if (monthIndex <= 0) return false;
  const costFor = (month: string) =>
    resourceRecords.filter((record) => record.billingMonth === month).reduce((total, record) => total + record.cost, 0);
  const priorMonths = months.slice(0, monthIndex);
  const priorAverage = priorMonths.reduce((total, month) => total + costFor(month), 0) / priorMonths.length;
  return priorAverage > 0 && costFor(billingMonth) > priorAverage * UNUSUAL_COST_MULTIPLIER;
}

export function buildResourceSummaries(
  resources: Resource[],
  records: BillingRecord[],
  projects: Project[],
  billingMonth: string,
  months: string[],
): ResourceSummary[] {
  const recordsByResource = new Map<string, BillingRecord[]>();
  for (const record of records) {
    const list = recordsByResource.get(record.resourceId) ?? [];
    list.push(record);
    recordsByResource.set(record.resourceId, list);
  }

  return resources.map((resource) => {
    const resourceRecords = recordsByResource.get(resource.id) ?? [];
    const monthRecords = resourceRecords.filter((record) => record.billingMonth === billingMonth);
    const flags: ReviewFlag[] = [...getTagIssues(resource, projects)];
    if (isUnusualCost(resourceRecords, billingMonth, months)) flags.push('Unusual cost');
    const projectId = monthRecords[0]?.projectId ?? resourceRecords[0]?.projectId ?? 'unallocated';
    return {
      resource,
      projectId,
      projectName: getProjectName(projectId, projects),
      cost: sumCost(monthRecords),
      usage: monthRecords.reduce((total, record) => total + record.usageQuantity, 0),
      usageUnit: resourceRecords[0]?.usageUnit ?? '',
      flags,
      ownershipStatus: flags.some((flag) => flag !== 'Unusual cost') ? 'Needs review' : 'Tagged',
    };
  });
}

export function servicesOf(records: BillingRecord[]): ServiceName[] {
  return [...new Set(records.map((record) => record.service))].sort() as ServiceName[];
}
