import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

export interface RankedBarItem {
  label: string;
  value: number;
  tone?: string;
}

interface RankedBarChartProps {
  data: RankedBarItem[];
  height?: number;
  valueLabel?: string;
}

export function RankedBarChart({ data, height = 280, valueLabel = 'Cost' }: RankedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#eef2f7" horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: '#f1f5f9' }}
          formatter={(value: number) => [formatCurrency(value), valueLabel]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((item, index) => (
            <Cell key={item.label} fill={item.tone ?? CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
