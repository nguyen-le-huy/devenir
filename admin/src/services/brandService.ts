import { api } from './api'

export interface Brand {
  _id: string
  name: string
  logoUrl?: string
  description?: string
  tagline?: string
  originCountry?: string
  foundedYear?: number
  website?: string
  isActive: boolean
  totalProducts?: number
  activeProducts?: number
  createdAt: string
  updatedAt: string
}

export interface BrandFormData {
  name: string
  description?: string
  tagline?: string
  originCountry?: string
  foundedYear?: number | null
  website?: string
  logoUrl?: string
  isActive: boolean
}

interface BrandListResponse {
  success: boolean
  data: Brand[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta?: {
    totalBrands: number
    activeBrands: number
    inactiveBrands: number
    totalProducts: number
    activeProducts: number
  }
  topBrands?: Array<{
    _id: string
    name: string
    logoUrl?: string
    originCountry?: string
    totalProducts?: number
  }>
}

export const brandService = {
  getBrands: async (params?: Record<string, unknown>): Promise<BrandListResponse> => {
    const response = await api.get('/brands', { params })
    return response.data
  },
  getBrandById: async (id: string) => {
    const response = await api.get(`/brands/${id}`)
    return response.data
  },
  createBrand: async (payload: BrandFormData) => {
    const response = await api.post('/brands/admin', payload)
    return response.data
  },
  updateBrand: async (id: string, payload: Partial<BrandFormData>) => {
    const response = await api.put(`/brands/admin/${id}`, payload)
    return response.data
  },
  deleteBrand: async (id: string) => {
    const response = await api.delete(`/brands/admin/${id}`)
    return response.data
  },
}
