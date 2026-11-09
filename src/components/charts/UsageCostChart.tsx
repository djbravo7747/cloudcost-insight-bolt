import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format';
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

export interface UsageCostPoint {
  label: string;
  usage: number;
  cost: number;
}

interface UsageCostChartProps {
  data: UsageCostPoint[];
  usageUnit: string;
}

export function UsageCostChart({ data, usageUnit }: UsageCostChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="cost"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompactCurrency}
          width={64}
        />
        <YAxis
          yAxisId="usage"
          orientation="right"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatNumber(value)}
          width={64}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number, name: string) =>
            name === 'Cost' ? [formatCurrency(value), name] : [`${formatNumber(value)} ${usageUnit}`, name]
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="cost" dataKey="cost" name="Cost" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} barSize={28} />
        <Line
          yAxisId="usage"
          type="monotone"
          dataKey="usage"
          name="Usage"
          stroke={CHART_COLORS[0]}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
