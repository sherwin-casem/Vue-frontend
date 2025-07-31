import { ref, computed, watch, ComputedRef } from 'vue'

export interface GroupByItem {
  id: string | number
  groupKey: string
  groupValue: any
  count: number
  items: any[]
  isExpanded: boolean
}

export interface UseGroupByOptions {
  items: ComputedRef<any[]>
  groupByFields: ComputedRef<string[]>
  getItemId?: (item: any) => string | number
}

export function useGroupBy(options: UseGroupByOptions) {
  const { items, groupByFields, getItemId = (item) => item.id || Math.random() } = options

  const expandedGroups = ref<Set<string>>(new Set())

  // Generate a unique group key for an item based on selected fields
  const getGroupKey = (item: any, fields: string[]): string => {
    if (fields.length === 0) return 'all'
    return fields.map((field) => String(item[field] || 'N/A')).join(' | ')
  }

  // Get display value for a group key
  const getGroupDisplayValue = (groupKey: string, fields: string[]): string => {
    if (groupKey === 'all') return 'All Items'
    const values = groupKey.split(' | ')
    return fields.map((field, index) => `${field}: ${values[index] || 'N/A'}`).join(', ')
  }

  // Group items by selected fields
  const groupedItems = computed((): GroupByItem[] => {
    const currentItems = items.value
    const currentFields = groupByFields.value

    if (currentFields.length === 0) {
      // No grouping - return all items as individual rows
      return currentItems.map((item) => ({
        id: getItemId(item),
        groupKey: 'item',
        groupValue: item,
        count: 1,
        items: [item],
        isExpanded: true
      }))
    }

    // Group items by the selected fields
    const groups = new Map<string, any[]>()

    currentItems.forEach((item) => {
      const groupKey = getGroupKey(item, currentFields)
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(item)
    })

    // Convert groups to GroupByItem array
    return Array.from(groups.entries())
      .map(([groupKey, groupItems]) => ({
        id: groupKey,
        groupKey,
        groupValue: getGroupDisplayValue(groupKey, currentFields),
        count: groupItems.length,
        items: groupItems,
        isExpanded: expandedGroups.value.has(groupKey)
      }))
      .sort((a, b) => a.groupValue.localeCompare(b.groupValue))
  })

  // Get flattened data for display (includes group headers and expanded items)
  const displayItems = computed(() => {
    const currentFields = groupByFields.value

    if (currentFields.length === 0) {
      return items.value
    }

    const result: any[] = []

    groupedItems.value.forEach((group) => {
      // Add group header
      result.push({
        _isGroupHeader: true,
        _groupKey: group.groupKey,
        _groupValue: group.groupValue,
        _count: group.count,
        _isExpanded: group.isExpanded,
        id: `group-${group.id}`,
        [currentFields[0]]: group.groupValue // For display in the first grouped column
      })

      // Add items if group is expanded
      if (group.isExpanded) {
        result.push(
          ...group.items.map((item) => ({
            ...item,
            _isGroupItem: true,
            _parentGroup: group.groupKey
          }))
        )
      }
    })

    return result
  })

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    if (expandedGroups.value.has(groupKey)) {
      expandedGroups.value.delete(groupKey)
    } else {
      expandedGroups.value.add(groupKey)
    }
  }

  // Expand all groups
  const expandAll = () => {
    groupedItems.value.forEach((group) => {
      expandedGroups.value.add(group.groupKey)
    })
  }

  // Collapse all groups
  const collapseAll = () => {
    expandedGroups.value.clear()
  }

  // Auto-expand groups when grouping changes
  watch(
    groupByFields,
    (newFields) => {
      if (newFields.length > 0) {
        // Auto-expand first few groups for better UX
        const firstGroups = groupedItems.value.slice(0, 3)
        firstGroups.forEach((group) => {
          expandedGroups.value.add(group.groupKey)
        })
      }
    },
    { immediate: true }
  )

  return {
    groupedItems,
    displayItems,
    expandedGroups,
    toggleGroup,
    expandAll,
    collapseAll,
    getGroupKey,
    getGroupDisplayValue
  }
}
