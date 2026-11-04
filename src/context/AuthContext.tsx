import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  authService,
  type AuthUser,
  type LoginPayload,
} from '../services/authService'

const USER_KEY = 'shreeni_admin_user'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    // Only trust a stored user if a token is also present.
    if (!raw || !authService.getToken()) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser())

  const login = async (payload: LoginPayload) => {
    const { user: loggedIn } = await authService.login(payload)
    setUser(loggedIn)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(loggedIn))
    } catch {
      // ignore storage errors
    }
    return loggedIn
  }

  const logout = () => {
    authService.logout()
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      // ignore
    }
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
