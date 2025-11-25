import { api } from './api'

export interface Color {
    _id: string
    name: string
    hex: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface ColorFormData {
    name: string
    hex: string
    isActive: boolean
}

export const colorService = {
    /**
     * Get all colors
     */
    getAllColors: async () => {
        const response = await api.get('/colors')
        return response.data
    },

    /**
     * Create new color (Admin only)
     */
    createColor: async (data: ColorFormData) => {
        const response = await api.post('/colors', data)
        return response.data
    },

    /**
     * Update color (Admin only)
     */
    updateColor: async (id: string, data: Partial<ColorFormData>) => {
        const response = await api.put(`/colors/${id}`, data)
        return response.data
    },

    /**
     * Delete color (Admin only)
     */
    deleteColor: async (id: string) => {
        const response = await api.delete(`/colors/${id}`)
        return response.data
    },
}
