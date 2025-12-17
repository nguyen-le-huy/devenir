import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shipmentService, type ShipmentFilters, type ShipmentListResponse } from '@/services/shipmentService'

export const SHIPMENT_KEYS = {
  all: ['shipments'] as const,
  lists: () => [...SHIPMENT_KEYS.all, 'list'] as const,
  list: (filters?: ShipmentFilters) => [...SHIPMENT_KEYS.lists(), filters] as const,
}

const useNormalizedFilters = (filters: ShipmentFilters) => {
  return useMemo(() => ({ ...filters }), [filters])
}

export const useShipmentList = (filters: ShipmentFilters) => {
  const normalizedFilters = useNormalizedFilters(filters)
  return useQuery<ShipmentListResponse>({
    queryKey: SHIPMENT_KEYS.list(normalizedFilters),
    queryFn: () => shipmentService.getShipments(filters),
    staleTime: 10_000,
    refetchInterval: filters.status === 'shipped' ? 15_000 : false,
  })
}

export const useShipmentMutations = () => {
  const queryClient = useQueryClient()

  const markDelivered = useMutation({
    mutationFn: (id: string) => shipmentService.markDelivered(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENT_KEYS.all })
    },
  })

  const cancelShipment = useMutation({
    mutationFn: (id: string) => shipmentService.cancelShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENT_KEYS.all })
    },
  })

  const startShipment = useMutation({
    mutationFn: ({ id, trackingNumber }: { id: string; trackingNumber?: string }) => shipmentService.startShipment(id, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENT_KEYS.all })
    },
  })

  return {
    markDelivered,
    cancelShipment,
    startShipment,
  }
}

export type { ShipmentStatus } from '@/services/shipmentService'
