export interface Site {
  site_id?: number
  name: string
  address: string
  postal_code: string
  city: string
  country: string
  note?: string
  created_at?: string
  updated_at?: string
}

export interface CreateSiteRequest {
  name: string
  address: string
  postal_code: string
  city: string
  country: string
  note?: string
}

export interface UpdateSiteRequest extends CreateSiteRequest {
  site_id: number
}

export interface SitesState {
  sites: Site[]
  loading: boolean
  error: string | null
  selectedSite: Site | null
}



export interface SitesApiResponse {
  sites?: Site[]
  site?: Site
  error?: string
  message?: string
}
