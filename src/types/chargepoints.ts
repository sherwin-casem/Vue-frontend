export interface ChargePoint {
  id?: number
  ocpp_charge_box_id: string
  site_id: number
  manufacturer: string
  model: string
  connector_count: number
  status: 'active' | 'inactive' | 'faulty'
  note?: string
  created_at?: string
  updated_at?: string

}

export interface CreateChargePointRequest {
  ocpp_charge_box_id: string
  site_id: number
  manufacturer: string
  model: string
  connector_count: number
  status: 'active' | 'inactive' | 'faulty'
  note?: string
}

export interface UpdateChargePointRequest extends CreateChargePointRequest {
  id: number
}

export interface ChargePointsState {
  chargePoints: ChargePoint[]
  loading: boolean
  error: string | null
  selectedChargePoint: ChargePoint | null
}



export interface ChargePointsApiResponse {
  evses?: ChargePoint[]
  chargePoint?: ChargePoint
  error?: string
  message?: string
}
