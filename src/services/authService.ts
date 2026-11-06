import apiClient, { AUTH_TOKEN_KEY } from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type { Role } from '../constants/enums'

/** Kept as an alias so existing imports keep working. */
export type UserRole = Role

export interface AuthUser {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  /** "First Last", built by the backend */
  name: string | null
  phone: string
  role: Role
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
    const { data } = await apiClient.post<LoginResponse>(ENDPOINTS.auth.login, payload)
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
