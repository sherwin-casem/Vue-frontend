import { defineStore } from 'pinia'
import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type {
  ChargePoint,
  CreateChargePointRequest,
  UpdateChargePointRequest,
  ChargePointsState,
  ChargePointsApiResponse
} from '@/types/chargepoints'

const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const useChargePointsStore = defineStore('chargepoints', {
  state: (): ChargePointsState => ({
    chargePoints: [],
    loading: false,
    error: null,
    selectedChargePoint: null
  }),

  getters: {
    getChargePointById:
      (state) =>
      (id: number): ChargePoint | undefined => {
        return state.chargePoints.find((cp) => cp.id === id)
      },

    getChargePointsBySiteId:
      (state) =>
      (siteId: number): ChargePoint[] => {
        return state.chargePoints.filter((cp) => cp.site_id === siteId)
      },

    // Return all charge points without filtering
    allChargePoints: (state): ChargePoint[] => {
      return [...state.chargePoints]
    },

    uniqueStatuses: (state): string[] => {
      return [...new Set(state.chargePoints.map((cp) => cp.status))].sort()
    },

    uniqueManufacturers: (state): string[] => {
      return [...new Set(state.chargePoints.map((cp) => cp.manufacturer))].sort()
    },

    chargepointsBySite:
      (state) =>
      (siteId: number): ChargePoint[] => {
        return state.chargePoints.filter((cp) => cp.site_id === siteId)
      }
  },

  actions: {
    async fetchChargePoints(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargePointsApiResponse> = await apiClient.get('/evses')

        if (response.data && response.data.evses) {
          this.chargePoints = response.data.evses
        } else if (response.data && !response.data.error) {
          // Handle case where chargePoints might be returned directly
          this.chargePoints = Array.isArray(response.data.evses) ? response.data.evses : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch charge points')
        }
      } catch (error) {
        console.error('Fetch charge points error:', error)

        const axiosError = error as AxiosError<ChargePointsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else if (axiosError.response?.status === 401) {
          this.error = 'Unauthorized - please login again'
        } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
          this.error = 'Unable to connect to server'
        } else {
          this.error = (error as Error).message || 'Failed to fetch charge points'
        }
      } finally {
        this.loading = false
      }
    },

    async createChargePoint(chargePointData: CreateChargePointRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargePointsApiResponse> = await apiClient.post(
          '/evses',
          chargePointData
        )

        if (response.data && !response.data.error) {
          // Refresh charge points list after creation
          await this.fetchChargePoints()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to create charge point')
        }
      } catch (error) {
        console.error('Create charge point error:', error)

        const axiosError = error as AxiosError<ChargePointsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to create charge point'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async updateChargePoint(chargePointData: UpdateChargePointRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargePointsApiResponse> = await apiClient.put(
          `/evses/${chargePointData.id}`,
          chargePointData
        )

        if (response.data && !response.data.error) {
          // Refresh charge points list after update
          await this.fetchChargePoints()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to update charge point')
        }
      } catch (error) {
        console.error('Update charge point error:', error)

        const axiosError = error as AxiosError<ChargePointsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to update charge point'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async deleteChargePoint(chargePointId: number): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargePointsApiResponse> = await apiClient.delete(
          `/evses/${chargePointId}`
        )

        if (response.data && !response.data.error) {
          // Refresh charge points list after deletion
          await this.fetchChargePoints()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to delete charge point')
        }
      } catch (error) {
        console.error('Delete charge point error:', error)

        const axiosError = error as AxiosError<ChargePointsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to delete charge point'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    setSelectedChargePoint(chargePoint: ChargePoint | null): void {
      this.selectedChargePoint = chargePoint
    },

    clearError(): void {
      this.error = null
    }
  }
})
