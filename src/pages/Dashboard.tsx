import { Link } from 'react-router-dom'
import Text from '../components/ui/Text'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" size="2xl" weight="bold">
          Dashboard
        </Text>
        <Text variant="muted" className="mt-1">
          Welcome{user?.name ? `, ${user.name}` : ' back'} — products, orders,
          and customers will live here.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Revenue', value: '₹0' },
          { label: 'Orders', value: '0' },
          { label: 'Products', value: '0' },
          { label: 'Customers', value: '1' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <Text size="sm" variant="muted">
              {stat.label}
            </Text>
            <Text size="2xl" weight="bold" className="mt-1">
              {stat.value}
            </Text>
          </div>
        ))}
      </div>

      <Link
        to="/components"
        className="inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      >
        View Component Library →
      </Link>
    </div>
  )
}
