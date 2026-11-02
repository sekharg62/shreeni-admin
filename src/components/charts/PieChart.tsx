import {
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { SERIES_COLORS } from './palette'

export type PieDatum = {
  name: string
  value: number
}

type PieChartProps = {
  data: PieDatum[]
  /** Renders a donut (hollow center) when true. */
  donut?: boolean
  height?: number
}

export default function PieChart({
  data,
  donut = false,
  height = 280,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={donut ? 60 : 0}
          outerRadius={95}
          paddingAngle={donut ? 2 : 0}
          stroke="#fcfcfb"
          strokeWidth={2}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </RPieChart>
    </ResponsiveContainer>
  )
}
