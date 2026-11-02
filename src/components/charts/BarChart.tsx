import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_COLOR, GRID_COLOR, INK, SERIES_COLORS } from './palette'
import type { ChartSeries } from './LineChart'

type BarChartProps = {
  data: Array<Record<string, number | string>>
  xKey: string
  series: ChartSeries[]
  height?: number
  stacked?: boolean
}

export default function BarChart({
  data,
  xKey,
  series,
  height = 280,
  stacked = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={AXIS_COLOR}
          tick={{ fill: INK, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: INK, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? 'stack' : undefined}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]}
            radius={stacked ? 0 : [4, 4, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  )
}
