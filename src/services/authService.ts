import apiClient, { AUTH_TOKEN_KEY } from './apiClient'

export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: UserRole
}

export interface LoginResponse {
  user: AuthUser
  auth_token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authService = {
  /** POST /auth/login — verifies credentials, returns user + token. */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
    // Persist the token so the request interceptor can attach it.
    localStorage.setItem(AUTH_TOKEN_KEY, data.auth_token)
    return data
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
  },
}
