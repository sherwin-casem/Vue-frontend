export interface ChargingProfile {
  id?: number // ChargingProfileID autoincrement
  charge_point_id: number // FK to OCPP_ChargePoint.ChargePointID
  stack_level: number // Priority in the profile stack (0 = highest)
  charging_profile_purpose: 'TxDefault' | 'TxProfile' | 'TxMaxProfile' // Purpose
  charging_profile_kind: 'Absolute' | 'Recurring' | 'Relative' // Type
  recurrency_kind?: 'Daily' | 'Weekly' // Recurrence
  valid_from: string // Validity start, ISO-8601
  valid_to: string // Validity end, ISO-8601
  duration_in_seconds?: number // Max. duration in seconds
  start_schedule?: string // Scheduled start, ISO-8601
  min_charging_rate?: number // Minimum power in kW
  description?: string // Free text description
  note?: string // Additional remark
  created_at?: string
  updated_at?: string
}

export interface CreateChargingProfileRequest {
  charge_point_id: number
  stack_level: number
  charging_profile_purpose: 'TxDefault' | 'TxProfile' | 'TxMaxProfile'
  charging_profile_kind: 'Absolute' | 'Recurring' | 'Relative'
  recurrency_kind?: 'Daily' | 'Weekly'
  valid_from: string
  valid_to: string
  duration_in_seconds?: number
  start_schedule?: string
  min_charging_rate?: number
  description?: string
  note?: string
}

export interface UpdateChargingProfileRequest extends CreateChargingProfileRequest {
  id: number
}

export interface ChargingProfileFilters {
  search?: string
  charge_point_id?: number
}

export interface ChargingProfilesState {
  chargingProfiles: ChargingProfile[]
  loading: boolean
  error: string | null
  selectedChargingProfile: ChargingProfile | null
}

export interface ChargingProfilesApiResponse {
  charging_profiles?: ChargingProfile[]
  error?: string
  message?: string
}
