import { Link } from 'react-router-dom'
import { ArrowRight, IndianRupee, PackageCheck, ShoppingBag, Truck, Wallet } from 'lucide-react'
import Text from '../components/ui/Text'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { orderService } from '../services'
import { formatPaise } from '../lib/money'

export default function Dashboard() {
  const { user } = useAuth()
  const counts = useApi(() => orderService.counts(), [])
  const c = counts.data

  const stats = c
    ? [
        { label: "Today's revenue", value: formatPaise(c.today.revenue), icon: IndianRupee, hint: 'Paid orders since midnight' },
        { label: "Today's orders", value: String(c.today.orders), icon: ShoppingBag, hint: 'Paid orders since midnight' },
        { label: 'To pack', value: String(c.CONFIRMED), icon: PackageCheck, to: '/orders?status=CONFIRMED', hint: 'Paid, not packed yet' },
        { label: 'To ship', value: String(c.PACKED), icon: Truck, to: '/orders?status=PACKED', hint: 'Packed, waiting for the courier' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" size="2xl" weight="bold">
          Dashboard
        </Text>
        <Text variant="muted" className="mt-1">
          Welcome{user?.name ? `, ${user.name}` : ' back'}. Here&apos;s what needs attention today.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!c
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : stats.map((s) => {
              const body = (
                <>
                  <div className="flex items-center justify-between">
                    <Text size="sm" variant="muted">
                      {s.label}
                    </Text>
                    <s.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <Text size="2xl" weight="bold" className="mt-1">
                    {s.value}
                  </Text>
                  <p className="mt-1 text-xs text-gray-500">{s.hint}</p>
                </>
              )
              return s.to ? (
                <Link key={s.label} to={s.to} className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-900">
                  {body}
                </Link>
              ) : (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5">
                  {body}
                </div>
              )
            })}
      </div>

      {c && c.PENDING > 0 && (
        <Link
          to="/orders?status=PENDING"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 transition-colors hover:border-amber-400"
        >
          <Wallet className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {c.PENDING} order{c.PENDING === 1 ? ' is' : 's are'} waiting for payment.
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {counts.error && <p className="text-sm text-red-600">Couldn&apos;t load order numbers: {counts.error}</p>}

      <Link to="/orders" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
        All orders <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>

      {/* Developer component showcase: development builds only. */}
      {import.meta.env.DEV && (
        <div>
          <Link to="/components" className="text-sm font-medium text-gray-500 underline-offset-2 hover:underline">
            View component library →
          </Link>
        </div>
      )}
    </div>
  )
}
