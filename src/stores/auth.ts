import { defineStore } from 'pinia'
import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type { 
  AuthState, 
  User, 
  LoginRequest, 
  LoginResponse, 
  LogoutResponse, 
  UserProfileResponse, 
  LoginResult 
} from '@/types/auth'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isAdmin: (state): boolean => state.user?.role === 'admin',
    isOperator: (state): boolean => state.user?.role === 'operator',
    userFullName: (state): string => {
      if (!state.user) return ''
      return state.user.username || `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim()
    },
  },
  
  actions: {
    async login(username: string, password: string): Promise<LoginResult> {
      this.loading = true
      this.error = null
      
      try {
        // Make login request to the real API
        const loginEndpoint = process.env.VUE_APP_API_LOGIN_ENDPOINT || '/auth/login'
        const response: AxiosResponse<LoginResponse> = await apiClient.post(loginEndpoint, {
          username,
          password
        } as LoginRequest)
        
        // Check if login was successful
        if (response.data && response.data.token) {
          const token = response.data.token
          this.setToken(token)
          
          // Set auth header for future requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Fetch user profile
          await this.fetchUserProfile()
          
          return { success: true }
        } else {
          throw new Error(response.data?.error || 'Login failed')
        }
      } catch (error) {
        console.error('Login error:', error)
        
        const axiosError = error as AxiosError<LoginResponse>
        
        // Handle different error scenarios
        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else if (axiosError.response?.status === 401) {
          this.error = 'Invalid credentials'
        } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
          this.error = 'Unable to connect to server. Please check your network connection.'
        } else {
          this.error = (error as Error).message || 'Authentication failed'
        }
        
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
    
    async logout(): Promise<void> {
      try {
        // Call logout API if we have a token
        if (this.token) {
          const logoutEndpoint = process.env.VUE_APP_API_LOGOUT_ENDPOINT || '/auth/logout'
          await apiClient.post<LogoutResponse>(logoutEndpoint)
        }
      } catch (error) {
        console.error('Logout API error:', error)
        // Continue with local logout even if API call fails
      } finally {
        // Clear local state
        this.user = null
        this.token = null
        this.error = null
        
        // Remove auth headers
        delete apiClient.defaults.headers.common['Authorization']
        delete axios.defaults.headers.common['Authorization']
        
        // Clear stored token
        localStorage.removeItem('auth_token')
      }
    },
    
    async fetchUserProfile(): Promise<void> {
      try {
        const meEndpoint = process.env.VUE_APP_API_ME_ENDPOINT || '/auth/me'
        const response: AxiosResponse<UserProfileResponse> = await apiClient.get(meEndpoint)
        
        if (response.data && !response.data.error) {
          this.setUser(response.data as User)
        } else {
          throw new Error(response.data?.error || 'Failed to fetch user profile')
        }
      } catch (error) {
        console.error('Fetch user profile error:', error)
        // If we can't fetch user profile, logout to be safe
        this.logout()
        throw error
      }
    },
    
    setUser(user: User): void {
      this.user = user
    },
    
    setToken(token: string): void {
      this.token = token
      
      // Store token in localStorage for persistence
      localStorage.setItem('auth_token', token)
    },
    
    // Initialize auth state from localStorage (called on app startup)
    async initAuth(): Promise<void> {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        this.token = token
        
        // Set auth headers
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        try {
          // Validate token by fetching user profile
          await this.fetchUserProfile()
        } catch (error) {
          console.error('Token validation failed:', error)
          // If token is invalid, clear it
          this.logout()
        }
      }
    },
    
    clearError(): void {
      this.error = null
    }
  }
})
