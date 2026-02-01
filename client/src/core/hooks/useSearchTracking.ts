import { useRef, useCallback } from 'react'
import { trackingService } from '@/core/services/trackingService'

interface SearchFilters {
  category?: string
  priceRange?: { min: number; max: number }
  colors?: string[]
  sizes?: string[]
  brands?: string[]
  sortBy?: string
  [key: string]: any
}

/**
 * Hook to track search queries and filters
 */
export function useSearchTracking() {
  const lastQueryRef = useRef<string>('')
  const searchStartTime = useRef<number>(0)

  /**
   * Track search query with optional filters
   */
  const trackSearch = useCallback((
    query: string,
    filters?: SearchFilters,
    resultsCount?: number
  ) => {
    // Don't track duplicate queries
    if (query === lastQueryRef.current && !filters) return

    lastQueryRef.current = query
    searchStartTime.current = Date.now()

    trackingService.trackSearch(query, filters, resultsCount)
  }, [])

  /**
   * Track when user clicks on search result
   */
  const trackSearchResultClick = useCallback((
    query: string,
    productId: string,
    productName: string,
    position: number
  ) => {
    const searchDuration = Date.now() - searchStartTime.current

    trackingService.trackEvent('search_result_click', {
      query,
      productId,
      productName,
      position,
      searchDuration,
      timestamp: new Date().toISOString(),
    })
  }, [])

  /**
   * Track filter changes
   */
  const trackFilterChange = useCallback((
    filterType: string,
    filterValue: any,
    query?: string
  ) => {
    trackingService.trackEvent('search_filter_applied', {
      filterType,
      filterValue,
      query,
      timestamp: new Date().toISOString(),
    })
  }, [])

  /**
   * Track no results scenario
   */
  const trackNoResults = useCallback((query: string, filters?: SearchFilters) => {
    trackingService.trackEvent('search_no_results', {
      query,
      filters,
      timestamp: new Date().toISOString(),
    })
  }, [])

  /**
   * Track autocomplete interactions
   */
  const trackAutocomplete = useCallback((
    query: string,
    selectedSuggestion?: string,
    suggestionPosition?: number
  ) => {
    trackingService.trackEvent('search_autocomplete', {
      query,
      selectedSuggestion,
      suggestionPosition,
      timestamp: new Date().toISOString(),
    })
  }, [])

  return {
    trackSearch,
    trackSearchResultClick,
    trackFilterChange,
    trackNoResults,
    trackAutocomplete,
  }
}

/**
 * Simple function to track quick searches
 */
export function trackQuickSearch(query: string) {
  trackingService.trackSearch(query)
}
