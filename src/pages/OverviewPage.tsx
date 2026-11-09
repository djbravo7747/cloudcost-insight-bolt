import { useMemo, useState } from 'react';
import { CircleDollarSign, Gauge, PiggyBank, Siren, TriangleAlert } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getBillingRecords,
  getBudgets,
  getCostSummary,
  getProjects,
  getResources,
} from '@/services/api';
import { BILLING_MONTHS, SERVICE_NAMES, SERVICE_PRICING } from '@/data/sampleCatalog';
import type { ServiceName } from '@/types';
import {
  buildResourceSummaries,
  filterBillingRecords,
  groupCostBy,
  monthlyCostSeries,
  monthlyUsageAndCost,
} from '@/lib/analytics';
import { getProjectName } from '@/lib/tags';
import { formatCurrency, formatMonth, formatPercent, formatShortMonth } from '@/lib/format';
import { Card, CardHeader } from '@/components/common/Card';
import { KpiCard } from '@/components/common/KpiCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { SelectField } from '@/components/common/FormControls';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { CostTrendChart } from '@/components/charts/CostTrendChart';
import { ServiceDonutChart } from '@/components/charts/ServiceDonutChart';
import { RankedBarChart } from '@/components/charts/RankedBarChart';
import { UsageCostChart } from '@/components/charts/UsageCostChart';
import { RecentBillingTable } from '@/components/overview/RecentBillingTable';
import { ReviewQueue } from '@/components/overview/ReviewQueue';

const RECENT_RECORD_COUNT = 8;
const REVIEW_ITEM_COUNT = 6;

function loadOverview(billingMonth: string) {
  return async () => {
    const [records, projects, resources, budgets] = await Promise.all([
      getBillingRecords(),
      getProjects(),
      getResources(),
      getBudgets(),
    ]);
    const summary = await getCostSummary(billingMonth, budgets);
    return { records, projects, resources, budgets, summary };
  };
}

export function OverviewPage() {
  const { billingMonth, projectFilter, searchQuery, navigate } = useAppState();
  const { data, error, loading, reload } = useAsyncData(loadOverview(billingMonth), [billingMonth]);
  const [trendService, setTrendService] = useState('all');
  const [usageService, setUsageService] = useState<ServiceName>('Data Transfer');

  const view = useMemo(() => {
    if (!data) return null;
    const { records, projects, resources, budgets, summary } = data;
    const projectRecords = filterBillingRecords(records, { projectId: projectFilter });
    const monthRecords = filterBillingRecords(projectRecords, { billingMonth });
    const portfolioSeries = monthlyCostSeries(records, BILLING_MONTHS);
    const currentIndex = BILLING_MONTHS.indexOf(billingMonth);
    const previousCost = currentIndex > 0 ? portfolioSeries[currentIndex - 1].cost : null;
    const change = previousCost ? ((summary.totalCost - previousCost) / previousCost) * 100 : null;

    const trendBudget = budgets
      .filter((budget) => budget.scope === 'Project' && (projectFilter === 'all' || budget.targetId === projectFilter))
      .reduce((total, budget) => total + budget.monthlyBudget, 0);
    const trendRecords = filterBillingRecords(projectRecords, { service: trendService });
    const trend = monthlyCostSeries(trendRecords, BILLING_MONTHS).map((point) => ({
      label: formatShortMonth(point.month),
      cost: point.cost,
      budget: trendService === 'all' ? trendBudget : undefined,
    }));

    const usageRecords = filterBillingRecords(projectRecords, { service: usageService });
    const usage = monthlyUsageAndCost(usageRecords, BILLING_MONTHS).map((point) => ({
      label: formatShortMonth(point.month),
      usage: point.usage,
      cost: point.cost,
    }));

    const query = searchQuery.trim().toLowerCase();
    const summaries = buildResourceSummaries(resources, records, projects, billingMonth, BILLING_MONTHS)
      .filter((item) => item.flags.length > 0)
      .filter((item) => projectFilter === 'all' || item.projectId === projectFilter)
      .filter((item) => !query || `${item.resource.name} ${item.resource.id}`.toLowerCase().includes(query))
      .sort((a, b) => b.cost - a.cost);

    const recent = monthRecords
      .filter((record) => !query || `${record.resourceId} ${record.service}`.toLowerCase().includes(query))
      .sort((a, b) => b.billingDate.localeCompare(a.billingDate) || b.cost - a.cost)
      .slice(0, RECENT_RECORD_COUNT);

    return {
      summary,
      change,
      trend,
      usage,
      serviceBreakdown: groupCostBy(monthRecords, (record) => record.service),
      projectBreakdown: groupCostBy(monthRecords, (record) => getProjectName(record.projectId, projects)).map(
        (item) => ({ label: item.key, value: item.cost }),
      ),
      recent,
      reviewItems: summaries.slice(0, REVIEW_ITEM_COUNT),
      reviewTotal: summaries.length,
      resourceCount: resources.length,
      projects,
    };
  }, [data, billingMonth, projectFilter, searchQuery, trendService, usageService]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !view) return <LoadingState label="Loading cost overview" />;

  const { summary } = view;
  const usageUnit = SERVICE_PRICING[usageService].unit;
  const utilizationTone = summary.budgetUtilization >= 100 ? 'danger' : summary.budgetUtilization >= 80 ? 'warning' : 'success';
  const changeLabel =
    view.change === null
      ? 'First billing period in range'
      : `${view.change >= 0 ? '+' : ''}${view.change.toFixed(1)}% vs previous month`;
  const projectFilterName =
    projectFilter === 'all' ? 'All projects' : getProjectName(projectFilter, view.projects);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          Billing period <span className="font-medium text-slate-700">{formatMonth(billingMonth)}</span>
          {' · '}Showing {projectFilterName}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Key metrics">
        <KpiCard
          label="Total Cloud Spend"
          value={formatCurrency(summary.totalCost)}
          helper={changeLabel}
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Monthly Budget"
          value={formatCurrency(summary.monthlyBudget)}
          helper="Sum of project budgets"
          icon={PiggyBank}
        />
        <KpiCard
          label="Budget Utilization"
          value={formatPercent(summary.budgetUtilization)}
          helper="Spend divided by monthly budget"
          icon={Gauge}
          accent={utilizationTone === 'danger' ? 'danger' : utilizationTone === 'warning' ? 'warning' : 'success'}
          footer={<ProgressBar value={summary.budgetUtilization} tone={utilizationTone} label=" " />}
        />
        <KpiCard
          label="Untagged Resources"
          value={String(summary.untaggedResources)}
          helper={`of ${view.resourceCount} resources missing or misusing tags`}
          icon={TriangleAlert}
          accent={summary.untaggedResources > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Budget Overruns"
          value={String(summary.budgetOverruns)}
          helper="Project and service budgets over limit"
          icon={Siren}
          accent={summary.budgetOverruns > 0 ? 'danger' : 'success'}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Monthly cost trend"
            subtitle="Six-month spend against the combined project budget"
            action={
              <SelectField
                label="Service"
                value={trendService}
                onChange={setTrendService}
                options={[{ value: 'all', label: 'All services' }, ...SERVICE_NAMES.map((name) => ({ value: name, label: name }))]}
              />
            }
          />
          <div className="p-5">
            <CostTrendChart data={view.trend} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Cost by service" subtitle={formatMonth(billingMonth)} />
          <div className="p-5">
            {view.serviceBreakdown.length === 0 ? (
              <EmptyState title="No spend recorded" description="No billing records match the current filters." />
            ) : (
              <ServiceDonutChart data={view.serviceBreakdown} />
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Cost by project" subtitle={formatMonth(billingMonth)} />
          <div className="p-5">
            {view.projectBreakdown.length === 0 ? (
              <EmptyState title="No spend recorded" description="No billing records match the current filters." />
            ) : (
              <RankedBarChart data={view.projectBreakdown} />
            )}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader
            title="Usage versus cost"
            subtitle="Usage is measured in one unit per service, so pick a service to compare"
            action={
              <SelectField
                label="Service"
                value={usageService}
                onChange={(value) => setUsageService(value as ServiceName)}
                options={SERVICE_NAMES.map((name) => ({ value: name, label: name }))}
              />
            }
          />
          <div className="p-5">
            <p className="mb-3 text-xs text-slate-500">
              Usage unit: <span className="font-medium text-slate-700">{usageUnit}</span>
            </p>
            <UsageCostChart data={view.usage} usageUnit={usageUnit} />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader title="Recent billing records" subtitle="Latest charges in the selected period" />
          {view.recent.length === 0 ? (
            <EmptyState title="No billing records" description="No charges match the selected period, project, or search." />
          ) : (
            <RecentBillingTable records={view.recent} projects={view.projects} />
          )}
        </Card>
        <Card>
          <CardHeader
            title="Resources requiring owner review"
            subtitle={`${view.reviewTotal} flagged in ${formatMonth(billingMonth)}`}
          />
          <ReviewQueue items={view.reviewItems} onViewAll={() => navigate('resources')} />
        </Card>
      </section>
    </div>
  );
}
