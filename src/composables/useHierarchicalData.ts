import { ref, computed } from 'vue'

export interface HierarchicalDataConfig {
  // Function to fetch children for a given parent
  fetchChildren: (parent: any) => Promise<any[]>
  // Function to determine if a parent has children
  hasChildren?: (parent: any) => boolean
  // Function to get a unique key for the parent (for caching)
  getParentKey: (parent: any) => string | number
  // Auto-load children when parent is expanded
  autoLoad?: boolean
}

export function useHierarchicalData(config: HierarchicalDataConfig) {
  // State management using refs
  const expandedItems = ref<Set<any>>(new Set())
  const childrenData = ref<Map<any, any[]>>(new Map())
  const loadingStates = ref<Set<any>>(new Set())
  const errorStates = ref<Map<any, string>>(new Map())

  // Computed properties
  const isExpanded = (parent: any): boolean => {
    return expandedItems.value.has(parent)
  }

  const isLoading = (parent: any): boolean => {
    return loadingStates.value.has(parent)
  }

  const hasError = (parent: any): boolean => {
    return errorStates.value.has(parent)
  }

  const getError = (parent: any): string | undefined => {
    return errorStates.value.get(parent)
  }

  const getChildren = (parent: any): any[] => {
    return childrenData.value.get(parent) || []
  }

  const hasChildren = (parent: any): boolean => {
    if (config.hasChildren) {
      return config.hasChildren(parent)
    }
    // Default: assume all parents can have children
    return true
  }

  // Actions
  const expand = async (parent: any): Promise<void> => {
    if (!hasChildren(parent)) return

    expandedItems.value.add(parent)

    // Auto-load children if enabled and not already loaded
    if (config.autoLoad !== false && !childrenData.value.has(parent)) {
      await loadChildren(parent)
    }
  }

  const collapse = (parent: any): void => {
    expandedItems.value.delete(parent)
  }

  const toggle = async (parent: any): Promise<void> => {
    if (isExpanded(parent)) {
      collapse(parent)
    } else {
      await expand(parent)
    }
  }

  const loadChildren = async (parent: any): Promise<any[]> => {
    const parentKey = config.getParentKey(parent)

    // Clear any previous error
    errorStates.value.delete(parent)

    // Set loading state
    loadingStates.value.add(parent)

    try {
      const children = await config.fetchChildren(parent)
      childrenData.value.set(parent, children)
      return children
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load children'
      errorStates.value.set(parent, errorMessage)
      console.error(`Failed to load children for parent ${parentKey}:`, error)
      return []
    } finally {
      loadingStates.value.delete(parent)
    }
  }

  const refreshChildren = async (parent: any): Promise<any[]> => {
    // Clear cached data and reload
    childrenData.value.delete(parent)
    errorStates.value.delete(parent)
    return await loadChildren(parent)
  }

  const clearData = (): void => {
    expandedItems.value.clear()
    childrenData.value.clear()
    loadingStates.value.clear()
    errorStates.value.clear()
  }

  const expandAll = async (parents: any[]): Promise<void> => {
    const promises = parents.map((parent) => expand(parent))
    await Promise.all(promises)
  }

  const collapseAll = (): void => {
    expandedItems.value.clear()
  }

  const preloadChildren = async (parent: any): Promise<void> => {
    if (!childrenData.value.has(parent)) {
      await loadChildren(parent)
    }
  }

  const removeParent = (parent: any): void => {
    expandedItems.value.delete(parent)
    childrenData.value.delete(parent)
    loadingStates.value.delete(parent)
    errorStates.value.delete(parent)
  }

  const updateChildren = (parent: any, children: any[]): void => {
    childrenData.value.set(parent, children)
  }

  // Batch operations
  const batchExpand = async (parents: any[]): Promise<void> => {
    for (const parent of parents) {
      await expand(parent)
    }
  }

  const batchCollapse = (parents: any[]): void => {
    parents.forEach((parent) => collapse(parent))
  }

  const batchLoadChildren = async (parents: any[]): Promise<void> => {
    const promises = parents.map((parent) => loadChildren(parent))
    await Promise.all(promises)
  }

  // Statistics
  const getStats = () => {
    return {
      totalParents: childrenData.value.size,
      expandedParents: expandedItems.value.size,
      loadingParents: loadingStates.value.size,
      parentsWithErrors: errorStates.value.size,
      totalChildren: Array.from(childrenData.value.values()).reduce(
        (sum, children) => sum + children.length,
        0
      )
    }
  }

  return {
    // State (readonly)
    expandedItems: computed(() => expandedItems.value),
    childrenData: computed(() => childrenData.value),
    loadingStates: computed(() => loadingStates.value),
    errorStates: computed(() => errorStates.value),

    // Computed helpers
    isExpanded,
    isLoading,
    hasError,
    getError,
    getChildren,
    hasChildren,

    // Actions
    expand,
    collapse,
    toggle,
    loadChildren,
    refreshChildren,
    clearData,
    expandAll,
    collapseAll,
    preloadChildren,
    removeParent,
    updateChildren,

    // Batch operations
    batchExpand,
    batchCollapse,
    batchLoadChildren,

    // Statistics
    getStats
  }
}

// Specialized composables for common use cases

export function useSiteChargePoints() {
  const { useChargePointsStore } = require('@/stores/chargepoints')
  const chargePointsStore = useChargePointsStore()

  return useHierarchicalData({
    fetchChildren: async (site: any) => {
      if (!site.site_id) return []

      // Ensure charge points are loaded
      if (chargePointsStore.allChargePoints.length === 0) {
        await chargePointsStore.fetchChargePoints()
      }

      return chargePointsStore.chargepointsBySite(site.site_id)
    },
    getParentKey: (site: any) => site.site_id || site.id,
    hasChildren: (site: any) => true, // All sites can potentially have charge points
    autoLoad: true
  })
}

export function useChargePointChildren() {
  const loadConnectors = async (chargePoint: any) => {
    const { useConnectorsStore } = require('@/stores/connectors')
    const connectorsStore = useConnectorsStore()

    if (!chargePoint.id) return []

    if (connectorsStore.allConnectors.length === 0) {
      await connectorsStore.fetchConnectors()
    }

    return connectorsStore.connectorsByChargePoint(chargePoint.id)
  }

  const loadChargingProfiles = async (chargePoint: any) => {
    const { useChargingProfilesStore } = require('@/stores/chargingprofiles')
    const chargingProfilesStore = useChargingProfilesStore()

    if (!chargePoint.id) return []

    if (chargingProfilesStore.allChargingProfiles.length === 0) {
      await chargingProfilesStore.fetchChargingProfiles()
    }

    return chargingProfilesStore.chargingProfilesByChargePoint(chargePoint.id)
  }

  // Return separate instances for different child types
  const connectors = useHierarchicalData({
    fetchChildren: loadConnectors,
    getParentKey: (chargePoint: any) => `connectors-${chargePoint.id}`,
    hasChildren: () => true,
    autoLoad: true
  })

  const chargingProfiles = useHierarchicalData({
    fetchChildren: loadChargingProfiles,
    getParentKey: (chargePoint: any) => `profiles-${chargePoint.id}`,
    hasChildren: () => true,
    autoLoad: true
  })

  return {
    connectors,
    chargingProfiles
  }
}

export function useChargingProfileChildren() {
  const loadSchedulePeriods = async (chargingProfile: any) => {
    const { useSchedulePeriodsStore } = require('@/stores/scheduleperiods')
    const schedulePeriodsStore = useSchedulePeriodsStore()

    if (!chargingProfile.id) return []

    if (schedulePeriodsStore.allSchedulePeriods.length === 0) {
      await schedulePeriodsStore.fetchSchedulePeriods()
    }

    return schedulePeriodsStore.periodsByChargingProfile(chargingProfile.id)
  }

  const schedulePeriods = useHierarchicalData({
    fetchChildren: loadSchedulePeriods,
    getParentKey: (chargingProfile: any) => `periods-${chargingProfile.id}`,
    hasChildren: () => true,
    autoLoad: true
  })

  return {
    schedulePeriods
  }
}

export default useHierarchicalData
