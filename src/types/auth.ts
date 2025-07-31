export interface User {
  role: string
  user_id: string
  username: string
  firstName?: string
  lastName?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token?: string
  error?: string
}

export interface LogoutResponse {
  message: string
}

export interface UserProfileResponse {
  role: string
  user_id: string
  username: string
  error?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export interface LoginResult {
  success: boolean
  error?: string
}
