import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_COLOR, GRID_COLOR, INK, SERIES_COLORS } from './palette'

export type ChartSeries = {
  /** Key in each data row */
  key: string
  /** Legend / tooltip label */
  label: string
}

type LineChartProps = {
  data: Array<Record<string, number | string>>
  xKey: string
  series: ChartSeries[]
  height?: number
}

export default function LineChart({
  data,
  xKey,
  series,
  height = 280,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
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
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  )
}
