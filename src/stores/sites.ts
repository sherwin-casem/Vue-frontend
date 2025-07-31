import { defineStore } from 'pinia'
import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type {
  Site,
  CreateSiteRequest,
  UpdateSiteRequest,
  SitesState,
  SitesApiResponse
} from '@/types/sites'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const useSitesStore = defineStore('sites', {
  state: (): SitesState => ({
    sites: [],
    loading: false,
    error: null,
    selectedSite: null
  }),

  getters: {
    getSiteById:
      (state) =>
      (id: number): Site | undefined => {
        return state.sites.find((site) => site.site_id === id)
      },

    // Return all sites without filtering
    allSites: (state): Site[] => {
      return [...state.sites]
    },

    uniqueCountries: (state): string[] => {
      return [...new Set(state.sites.map((site) => site.country))].sort()
    },

    uniqueCities: (state): string[] => {
      return [...new Set(state.sites.map((site) => site.city))].sort()
    }
  },

  actions: {
    async fetchSites(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SitesApiResponse> = await apiClient.get('/sites')

        if (response.data && response.data.sites) {
          this.sites = response.data.sites
        } else if (response.data && !response.data.error) {
          // Handle case where sites might be returned directly
          this.sites = Array.isArray(response.data) ? response.data : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch sites')
        }
      } catch (error) {
        console.error('Fetch sites error:', error)

        const axiosError = error as AxiosError<SitesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else if (axiosError.response?.status === 401) {
          this.error = 'Unauthorized - please login again'
        } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
          this.error = 'Unable to connect to server'
        } else {
          this.error = (error as Error).message || 'Failed to fetch sites'
        }
      } finally {
        this.loading = false
      }
    },

    async createSite(siteData: CreateSiteRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SitesApiResponse> = await apiClient.post('/sites', siteData)

        if (response.data && !response.data.error) {
          // Refresh sites list after creation
          await this.fetchSites()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to create site')
        }
      } catch (error) {
        console.error('Create site error:', error)

        const axiosError = error as AxiosError<SitesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to create site'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async updateSite(siteData: UpdateSiteRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SitesApiResponse> = await apiClient.put(
          `/sites/${siteData.site_id}`,
          siteData
        )

        if (response.data && !response.data.error) {
          // Refresh sites list after update
          await this.fetchSites()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to update site')
        }
      } catch (error) {
        console.error('Update site error:', error)

        const axiosError = error as AxiosError<SitesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to update site'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async deleteSite(siteId: number): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<SitesApiResponse> = await apiClient.delete(`/sites/${siteId}`)

        if (response.data && !response.data.error) {
          // Refresh sites list after deletion
          await this.fetchSites()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to delete site')
        }
      } catch (error) {
        console.error('Delete site error:', error)

        const axiosError = error as AxiosError<SitesApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to delete site'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    setSelectedSite(site: Site | null): void {
      this.selectedSite = site
    },

    clearError(): void {
      this.error = null
    }
  }
})
