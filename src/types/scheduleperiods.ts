export interface SchedulePeriod {
  id?: number // SchedulePeriodID autoincrement
  charging_profile_id: number // FK to OCPP_ChargingProfile.ChargingProfileID
  start_period_in_seconds: number // Offset from profile start (seconds)
  limit: number // Power limit in kW
  number_phases: number // Number of phases during charging (1–3)
  created_at?: string
  updated_at?: string
}

export interface CreateSchedulePeriodRequest {
  charging_profile_id: number
  start_period_in_seconds: number
  limit: number
  number_phases: number
}

export interface UpdateSchedulePeriodRequest extends CreateSchedulePeriodRequest {
  id: number
}

export interface SchedulePeriodFilters {
  search?: string
  charging_profile_id?: number
  number_phases?: number
}

export interface SchedulePeriodsState {
  schedulePeriods: SchedulePeriod[]
  loading: boolean
  error: string | null
  selectedSchedulePeriod: SchedulePeriod | null
}

export interface SchedulePeriodsApiResponse {
  schedule_periods?: SchedulePeriod[]
  error?: string
  message?: string
}
