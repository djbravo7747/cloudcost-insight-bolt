import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/format';
import { CHART_COLORS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import type { GroupedCost } from '@/lib/analytics';

interface ServiceDonutChartProps {
  data: GroupedCost[];
}

export function ServiceDonutChart({ data }: ServiceDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.cost, 0);
  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="cost" nameKey="key" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((item, index) => (
                <Cell key={item.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [
                `${formatCurrency(value)} (${formatPercent(total > 0 ? (value / total) * 100 : 0)})`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((item, index) => (
          <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate text-slate-700">{item.key}</span>
            </span>
            <span className="tabular-nums text-slate-500">{formatPercent(total > 0 ? (item.cost / total) * 100 : 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
