import {
  Bar,
  BarChart as RBarChart,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_COLOR, GRID_COLOR, INK, NEGATIVE, POSITIVE } from './palette'

type DivergingBarChartProps = {
  data: Array<Record<string, number | string>>
  xKey: string
  valueKey: string
  height?: number
}

/** Single-series bar chart with positive (green) / negative (red) polarity. */
export default function DivergingBarChart({
  data,
  xKey,
  valueKey,
  height = 280,
}: DivergingBarChartProps) {
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
        <ReferenceLine y={0} stroke={AXIS_COLOR} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 12,
          }}
        />
        <Bar dataKey={valueKey} maxBarSize={48} radius={[4, 4, 0, 0]}>
          {data.map((row, i) => (
            <Cell
              key={i}
              fill={Number(row[valueKey]) >= 0 ? POSITIVE : NEGATIVE}
            />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  )
}
