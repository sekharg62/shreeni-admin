import axios, { AxiosError } from 'axios'

export const AUTH_TOKEN_KEY = 'shreeni_admin_token'

// Single axios instance used across all services.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach the auth token (if present) to every request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize errors; drop the token and bounce to login on 401.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

/** Pull a human-readable message out of an axios error. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined
    const msg = data?.message
    if (typeof msg === 'string') return msg
    // Nest validation errors can nest another message object.
    if (msg && typeof msg === 'object' && 'message' in msg) {
      const inner = (msg as { message?: unknown }).message
      if (typeof inner === 'string') return inner
      if (Array.isArray(inner)) return inner.join(', ')
    }
    return error.message || fallback
  }
  return fallback
}

export default apiClient
