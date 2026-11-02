import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Shreeni Admin</h1>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Sign Out
        </button>
      </header>

      <main className="p-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-500">
          Welcome back. This is a placeholder dashboard — products, orders, and
          customers will live here.
        </p>

        <Link
          to="/components"
          className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        >
          View Component Library →
        </Link>
      </main>
    </div>
  )
}
