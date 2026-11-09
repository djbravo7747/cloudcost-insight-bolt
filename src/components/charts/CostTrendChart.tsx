import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

export interface TrendPoint {
  label: string;
  cost: number;
  budget?: number;
}

interface CostTrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export function CostTrendChart({ data, height = 280 }: CostTrendChartProps) {
  const hasBudget = data.some((point) => point.budget !== undefined);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} width={64} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => formatCurrency(value)} />
        <Line
          type="monotone"
          dataKey="cost"
          name="Actual cost"
          stroke={CHART_COLORS[0]}
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        {hasBudget && (
          <Line
            type="monotone"
            dataKey="budget"
            name="Budget"
            stroke="#94a3b8"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
