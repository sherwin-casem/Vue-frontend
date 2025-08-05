import { defineStore } from 'pinia'
import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type {
  Connector,
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorsState,
  ConnectorFilters,
  ConnectorsApiResponse
} from '@/types/connectors'

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

export const useConnectorsStore = defineStore('connectors', {
  state: (): ConnectorsState => ({
    connectors: [],
    loading: false,
    error: null,
    selectedConnector: null
  }),

  getters: {
    getConnectorById:
      (state) =>
      (id: number): Connector | undefined => {
        return state.connectors.find((connector) => connector.id === id)
      },

    filteredConnectors:
      (state) =>
      (filters: ConnectorFilters): Connector[] => {
        let filtered = [...state.connectors]

        if (filters.search) {
          const searchTerm = filters.search?.toLowerCase()
          filtered = filtered.filter(
            (connector) =>
              connector.type?.toLowerCase().includes(searchTerm) ||
              connector.connector_number.toString().includes(searchTerm)
          )
        }

        if (filters.status) {
          filtered = filtered.filter((connector) => connector.status === filters.status)
        }

        if (filters.type) {
          filtered = filtered.filter((connector) => connector.type === filters.type)
        }

        if (filters.charge_point_id) {
          filtered = filtered.filter(
            (connector) => connector.charge_point_id === filters.charge_point_id
          )
        }

        return filtered
      },

    uniqueStatuses: (state): string[] => {
      return [...new Set(state.connectors.map((connector) => connector.status))].sort()
    },

    uniqueTypes: (state): string[] => {
      return [...new Set(state.connectors.map((connector) => connector.type))].sort()
    },

    connectorsByChargePoint:
      (state) =>
      (chargePointId: number): Connector[] => {
        return state.connectors.filter((connector) => connector.charge_point_id === chargePointId)
      },

    getConnectorsByChargePointId:
      (state) =>
      (chargePointId: number): Connector[] => {
        return state.connectors.filter((connector) => connector.charge_point_id === chargePointId)
      },

    allConnectors: (state): Connector[] => {
      return [...state.connectors]
    }
  },

  actions: {
    async fetchConnectors(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ConnectorsApiResponse> = await apiClient.get('/connectors')

        if (response.data && response.data.connectors) {
          this.connectors = response.data.connectors
        } else if (response.data && !response.data.error) {
          this.connectors = Array.isArray(response.data) ? response.data : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch connectors')
        }
      } catch (error) {
        console.error('Fetch connectors error:', error)

        const axiosError = error as AxiosError<ConnectorsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else if (axiosError.response?.status === 401) {
          this.error = 'Unauthorized - please login again'
        } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
          this.error = 'Unable to connect to server'
        } else {
          this.error = (error as Error).message || 'Failed to fetch connectors'
        }
      } finally {
        this.loading = false
      }
    },

    async fetchConnectorsBySiteId(siteId: number): Promise<Connector[]> {
      try {
        const response: AxiosResponse<ConnectorsApiResponse> = await apiClient.get(
          `/connectors?site_id=${siteId}`
        )

        if (response.data && response.data.connectors) {
          return response.data.connectors
        } else if (response.data && !response.data.error) {
          return Array.isArray(response.data.connectors) ? response.data.connectors : []
        } else {
          throw new Error(response.data?.error || 'Failed to fetch connectors')
        }
      } catch (error) {
        console.error('Fetch connectors by site ID error:', error)
        return []
      }
    },

    async createConnector(connectorData: CreateConnectorRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ConnectorsApiResponse> = await apiClient.post(
          '/connectors',
          connectorData
        )

        if (response.data && !response.data.error) {
          await this.fetchConnectors()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to create connector')
        }
      } catch (error) {
        console.error('Create connector error:', error)

        const axiosError = error as AxiosError<ConnectorsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to create connector'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async updateConnector(connectorData: UpdateConnectorRequest): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ConnectorsApiResponse> = await apiClient.put(
          `/connectors/${connectorData.id}`,
          connectorData
        )

        if (response.data && !response.data.error) {
          await this.fetchConnectors()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to update connector')
        }
      } catch (error) {
        console.error('Update connector error:', error)

        const axiosError = error as AxiosError<ConnectorsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to update connector'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    async deleteConnector(connectorId: number): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response: AxiosResponse<ConnectorsApiResponse> = await apiClient.delete(
          `/connectors/${connectorId}`
        )

        if (response.data && !response.data.error) {
          await this.fetchConnectors()
          return true
        } else {
          throw new Error(response.data?.error || 'Failed to delete connector')
        }
      } catch (error) {
        console.error('Delete connector error:', error)

        const axiosError = error as AxiosError<ConnectorsApiResponse>

        if (axiosError.response?.data?.error) {
          this.error = axiosError.response.data.error
        } else {
          this.error = (error as Error).message || 'Failed to delete connector'
        }

        return false
      } finally {
        this.loading = false
      }
    },

    setSelectedConnector(connector: Connector | null): void {
      this.selectedConnector = connector
    },

    clearError(): void {
      this.error = null
    }
  }
})
