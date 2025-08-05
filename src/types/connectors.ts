export interface Connector {
  id?: number // ConnectorID autoincrement
  charge_point_id: number // FK to OCPP_ChargePoint.ChargePointID
  connector_number: number // Physical number on the device
  type: string // Connector type (e.g. CCS, Type2)
  max_power_kw: number // Max. power in kW
  status: 'available' | 'faulted' // Connector status
  last_status_change?: string // Last time status was changed
  created_at?: string
  updated_at?: string
}

export interface CreateConnectorRequest {
  charge_point_id: number
  connector_number: number
  type: string
  max_power_kw: number
  status: 'available' | 'faulted'
}

export interface UpdateConnectorRequest extends CreateConnectorRequest {
  id: number
}

export interface ConnectorFilters {
  search?: string
  status?: string
  type?: string
  charge_point_id?: number
}

export interface ConnectorsState {
  connectors: Connector[]
  loading: boolean
  error: string | null
  selectedConnector: Connector | null
}

export interface ConnectorsApiResponse {
  connectors?: Connector[]
  error?: string
  message?: string
}
