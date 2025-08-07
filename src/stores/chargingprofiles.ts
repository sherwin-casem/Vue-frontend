import { defineStore } from 'pinia'
import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type {
  ChargingProfile,
  CreateChargingProfileRequest,
  UpdateChargingProfileRequest,
  ChargingProfilesState,
  ChargingProfileFilters,
  ChargingProfilesApiResponse
} from '@/types/chargingprofiles'

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

export const useChargingProfilesStore = defineStore('chargingProfiles', {
  state: (): ChargingProfilesState => ({
    chargingProfiles: [],
    loading: false,
    error: null,
    selectedChargingProfile: null
  }),

  getters: {
    getChargingProfileById:
      (state) =>
      (id: number): ChargingProfile | undefined => {
        return state.chargingProfiles.find((profile) => profile.id === id)
      },

    filteredChargingProfiles:
      (state) =>
      (filters: ChargingProfileFilters): ChargingProfile[] => {
        let filtered = [...state.chargingProfiles]

        if (filters.search) {
          const searchTerm = filters.search?.toLowerCase()
          filtered = filtered.filter(
            (profile) =>
              profile.description?.toLowerCase().includes(searchTerm) ||
              profile.note?.toLowerCase().includes(searchTerm) ||
              profile.charging_profile_purpose?.toLowerCase().includes(searchTerm) ||
              profile.charging_profile_kind?.toLowerCase().includes(searchTerm)
          )
        }

        if (filters.charge_point_id) {
          filtered = filtered.filter(
            (profile) => profile.charge_point_id === filters.charge_point_id
          )
        }

        return filtered
      },

    uniquePurposes: (state): string[] => {
      return [
        ...new Set(state.chargingProfiles.map((profile) => profile.charging_profile_purpose))
      ].sort()
    },

    uniqueKinds: (state): string[] => {
      return [
        ...new Set(state.chargingProfiles.map((profile) => profile.charging_profile_kind))
      ].sort()
    },

    profilesByChargePoint:
      (state) =>
      (chargePointId: number): ChargingProfile[] => {
        return state.chargingProfiles.filter((profile) => profile.charge_point_id === chargePointId)
      },

    chargingProfilesByChargePoint:
      (state) =>
      (chargePointId: number): ChargingProfile[] => {
        return state.chargingProfiles.filter((profile) => profile.charge_point_id === chargePointId)
      },

    getChargingProfilesByChargePointId:
      (state) =>
      (chargePointId: number): ChargingProfile[] => {
        return state.chargingProfiles.filter((profile) => profile.charge_point_id === chargePointId)
      },

    allChargingProfiles: (state): ChargingProfile[] => {
      return [...state.chargingProfiles]
    }
  },

  actions: {
    async fetchChargingProfiles(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargingProfilesApiResponse> = await apiClient.get(
          '/charging-profiles'
        )

        if (response.data && response.data.charging_profiles) {
          this.chargingProfiles = response.data.charging_profiles
        } else if (response.data && !response.data.error) {
          this.chargingProfiles = Array.isArray(response.data.charging_profiles)
            ? response.data.charging_profiles
            : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch charging profiles')
        }
      } catch (error) {
        console.error('Fetch charging profiles error:', error)

        const axiosError = error as AxiosError<ChargingProfilesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else if (axiosError.response?.status === 401) {
          this.error = 'Unauthorized - please login again'
        } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
          this.error = 'Unable to connect to server'
        } else {
          this.error = (error as Error).message || 'Failed to fetch charging profiles'
        }
      } finally {
        this.loading = false
      }
    },

    async fetchChargingProfilesByChargePointId(chargePointId: number): Promise<ChargingProfile[]> {
      try {
        const response: AxiosResponse<ChargingProfilesApiResponse> = await apiClient.get(
          `/charging-profiles?charge_point_id=${chargePointId}`
        )

        if (response.data && response.data.charging_profiles) {
          return response.data.charging_profiles
        } else if (response.data && !response.data.error) {
          return Array.isArray(response.data.charging_profiles)
            ? response.data.charging_profiles
            : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch charging profiles')
        }
      } catch (error) {
        console.error('Fetch charging profiles by charge point ID error:', error)
        return []
      }
    },

    async fetchChargingProfileById(profileId: number): Promise<ChargingProfile | null> {
      try {
        // First check if we already have the profile in our state
        const existingProfile = this.getChargingProfileById(profileId)
        if (existingProfile) {
          return existingProfile
        }

        // If not found, fetch from API
        const response: AxiosResponse<{ charging_profile?: ChargingProfile; error?: string }> =
          await apiClient.get(`/charging-profiles/${profileId}`)

        if (response.data && response.data.charging_profile) {
          return response.data.charging_profile
        } else {
          throw new Error(response.data?.error || 'Failed to fetch charging profile')
        }
      } catch (error) {
        console.error('Fetch charging profile by ID error:', error)
        return null
      }
    },

    async createChargingProfile(profileData: CreateChargingProfileRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargingProfilesApiResponse> = await apiClient.post(
          '/charging-profiles',
          profileData
        )

        if (response.data && !response.data.error) {
          await this.fetchChargingProfiles()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to create charging profile')
        }
      } catch (error) {
        console.error('Create charging profile error:', error)

        const axiosError = error as AxiosError<ChargingProfilesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to create charging profile'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async updateChargingProfile(profileData: UpdateChargingProfileRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargingProfilesApiResponse> = await apiClient.put(
          `/charging-profiles/${profileData.id}`,
          profileData
        )

        if (response.data && !response.data.error) {
          await this.fetchChargingProfiles()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to update charging profile')
        }
      } catch (error) {
        console.error('Update charging profile error:', error)

        const axiosError = error as AxiosError<ChargingProfilesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to update charging profile'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async deleteChargingProfile(profileId: number): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ChargingProfilesApiResponse> = await apiClient.delete(
          `/charging-profiles/${profileId}`
        )

        if (response.data && !response.data.error) {
          await this.fetchChargingProfiles()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to delete charging profile')
        }
      } catch (error) {
        console.error('Delete charging profile error:', error)

        const axiosError = error as AxiosError<ChargingProfilesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to delete charging profile'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    setSelectedChargingProfile(profile: ChargingProfile | null): void {
      this.selectedChargingProfile = profile
    },

    clearError(): void {
      this.error = null
    }
  }
})
