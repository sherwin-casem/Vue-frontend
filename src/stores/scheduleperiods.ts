import { defineStore } from 'pinia'
import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type {
  SchedulePeriod,
  CreateSchedulePeriodRequest,
  UpdateSchedulePeriodRequest,
  SchedulePeriodsState,
  SchedulePeriodFilters,
  SchedulePeriodsApiResponse
} from '@/types/scheduleperiods'

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

export const useSchedulePeriodsStore = defineStore('schedulePeriods', {
  state: (): SchedulePeriodsState => ({
    schedulePeriods: [],
    loading: false,
    error: null,
    selectedSchedulePeriod: null
  }),

  getters: {
    getSchedulePeriodById:
      (state) =>
      (id: number): SchedulePeriod | undefined => {
        return state.schedulePeriods.find((period) => period.id === id)
      },

    filteredSchedulePeriods:
      (state) =>
      (filters: SchedulePeriodFilters): SchedulePeriod[] => {
        let filtered = [...state.schedulePeriods]

        if (filters.search) {
          const searchTerm = filters.search?.toLowerCase()
          filtered = filtered.filter(
            (period) =>
              period.limit.toString().includes(searchTerm) ||
              period.start_period_in_seconds.toString().includes(searchTerm) ||
              period.number_phases.toString().includes(searchTerm)
          )
        }

        if (filters.charging_profile_id) {
          filtered = filtered.filter(
            (period) => period.charging_profile_id === filters.charging_profile_id
          )
        }

        if (filters.number_phases) {
          filtered = filtered.filter((period) => period.number_phases === filters.number_phases)
        }

        return filtered
      },

    uniquePhases: (state): number[] => {
      return [...new Set(state.schedulePeriods.map((period) => period.number_phases))].sort(
        (a, b) => a - b
      )
    },

    periodsByChargingProfile:
      (state) =>
      (chargingProfileId: number): SchedulePeriod[] => {
        return state.schedulePeriods.filter(
          (period) => period.charging_profile_id === chargingProfileId
        )
      },

    getSchedulePeriodsByProfileId:
      (state) =>
      (chargingProfileId: number): SchedulePeriod[] => {
        return state.schedulePeriods.filter(
          (period) => period.charging_profile_id === chargingProfileId
        )
      },

    allSchedulePeriods: (state): SchedulePeriod[] => {
      return [...state.schedulePeriods]
    }
  },

  actions: {
    async fetchSchedulePeriods(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SchedulePeriodsApiResponse> = await apiClient.get(
          '/schedule-periods'
        )

        if (response.data && response.data.schedule_periods) {
          this.schedulePeriods = response.data.schedule_periods
        } else if (response.data && !response.data.error) {
          this.schedulePeriods = Array.isArray(response.data.schedule_periods)
            ? response.data.schedule_periods
            : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch schedule periods')
        }
      } catch (error) {
        console.error('Fetch schedule periods error:', error)

        const axiosError = error as AxiosError<SchedulePeriodsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else if (axiosError.response?.status === 401) {
          this.error = 'Unauthorized - please login again'
        } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
          this.error = 'Unable to connect to server'
        } else {
          this.error = (error as Error).message || 'Failed to fetch schedule periods'
        }
      } finally {
        this.loading = false
      }
    },

    async fetchSchedulePeriodsByChargingProfileId(
      chargingProfileId: number
    ): Promise<SchedulePeriod[]> {
      try {
        const response: AxiosResponse<SchedulePeriodsApiResponse> = await apiClient.get(
          `/schedule-periods?charging_profile_id=${chargingProfileId}`
        )

        if (response.data && response.data.schedule_periods) {
          return response.data.schedule_periods
        } else if (response.data && !response.data.error) {
          return Array.isArray(response.data.schedule_periods) ? response.data.schedule_periods : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch schedule periods')
        }
      } catch (error) {
        console.error('Fetch schedule periods by charging profile ID error:', error)
        return []
      }
    },

    async createSchedulePeriod(periodData: CreateSchedulePeriodRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SchedulePeriodsApiResponse> = await apiClient.post(
          '/schedule-periods',
          periodData
        )

        if (response.data && !response.data.error) {
          await this.fetchSchedulePeriods()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to create schedule period')
        }
      } catch (error) {
        console.error('Create schedule period error:', error)

        const axiosError = error as AxiosError<SchedulePeriodsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to create schedule period'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async updateSchedulePeriod(periodData: UpdateSchedulePeriodRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SchedulePeriodsApiResponse> = await apiClient.put(
          `/schedule-periods/${periodData.id}`,
          periodData
        )

        if (response.data && !response.data.error) {
          await this.fetchSchedulePeriods()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to update schedule period')
        }
      } catch (error) {
        console.error('Update schedule period error:', error)

        const axiosError = error as AxiosError<SchedulePeriodsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to update schedule period'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async deleteSchedulePeriod(periodId: number): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SchedulePeriodsApiResponse> = await apiClient.delete(
          `/schedule-periods/${periodId}`
        )

        if (response.data && !response.data.error) {
          await this.fetchSchedulePeriods()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to delete schedule period')
        }
      } catch (error) {
        console.error('Delete schedule period error:', error)

        const axiosError = error as AxiosError<SchedulePeriodsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to delete schedule period'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    setSelectedSchedulePeriod(period: SchedulePeriod | null): void {
      this.selectedSchedulePeriod = period
    },

    clearError(): void {
      this.error = null
    }
  }
})
