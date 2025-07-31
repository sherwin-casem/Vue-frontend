export * from './auth'
export * from './env'
export * from './sites'
export * from './chargepoints'

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Generic pagination
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

// Common status types
export type Status = 'active' | 'inactive' | 'pending' | 'error'

// Theme types
export type Theme = 'light' | 'dark'
