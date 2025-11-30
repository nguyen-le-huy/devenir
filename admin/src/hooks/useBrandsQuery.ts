import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandService, type BrandFormData } from '@/services/brandService'
import { QUERY_KEYS } from '@/lib/queryClient'
import { connectAdminSocket } from '@/lib/socket'

export function useBrandsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...QUERY_KEYS.brands.list(), params],
    queryFn: () => brandService.getBrands(params),
    staleTime: 30 * 1000,
  })
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BrandFormData) => brandService.createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.list(), refetchType: 'active' })
    },
  })
}

export function useUpdateBrandMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BrandFormData> }) => brandService.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.list(), refetchType: 'active' })
    },
  })
}

export function useDeleteBrandMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => brandService.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.list(), refetchType: 'active' })
    },
  })
}

export function useBrandsRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = connectAdminSocket()
    const events: Array<'brand:created' | 'brand:updated' | 'brand:deleted' | 'product:created' | 'product:updated' | 'product:deleted'> = [
      'brand:created',
      'brand:updated',
      'brand:deleted',
      'product:created',
      'product:updated',
      'product:deleted',
    ]

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.list(), refetchType: 'active' })
    }

    events.forEach((event) => socket.on(event, invalidate))

    return () => {
      events.forEach((event) => socket.off(event, invalidate))
    }
  }, [queryClient])
}
