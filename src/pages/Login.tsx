import { useState, type FormEventHandler } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Text from '../components/ui/Text'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../services/apiClient'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already signed in → skip the login screen.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white">
            S
          </div>
          <Text as="h1" size="xl" weight="bold">
            Welcome back
          </Text>
          <Text size="sm" variant="muted" className="mt-1">
            Sign in to the Shreeni admin dashboard
          </Text>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2">
                <Text size="sm" variant="danger">
                  {error}
                </Text>
              </div>
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shreeni.com"
              disabled={loading}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              className="mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <Text size="xs" variant="subtle" align="center" className="mt-6">
          © {new Date().getFullYear()} Shreeni. All rights reserved.
        </Text>
      </div>
    </div>
  )
}
