/**
 * High-performance reactive group-by function for Vue 3 Composition API
 * Groups data by one or more fields recursively with count and nested structure
 */

export interface GroupNode {
  field: string
  key: string
  count: number
  children: GroupNode[] | any[]
}

export interface GroupByOptions {
  labelFormatter?: (groupKey: string, field: string) => string
  unknownLabel?: string
  sortGroupKeys?: boolean
}

/**
 * Groups array of objects by nested fields
 * @param data - Array of objects to group
 * @param fields - Array of field names to group by (e.g., ["status", "site"])
 * @param options - Optional configuration
 * @returns Nested group structure
 */
export function groupByNested(
  data: any[],
  fields: string[],
  options: GroupByOptions = {}
): GroupNode[] {
  const { labelFormatter, unknownLabel = 'Unknown', sortGroupKeys = true } = options

  if (!data || data.length === 0) {
    return []
  }

  if (!fields || fields.length === 0) {
    return []
  }

  // Create a deep copy to avoid mutating original data
  const workingData = data.map((item) => ({ ...item }))

  function groupRecursive(
    items: any[],
    remainingFields: string[],
    currentField?: string
  ): GroupNode[] | any[] {
    // Base case: no more fields to group by, return the items
    if (remainingFields.length === 0) {
      return items
    }

    const [currentFieldToGroup, ...nextFields] = remainingFields
    const groups = new Map<string, any[]>()

    // Group items by current field
    for (const item of items) {
      let groupKey = item[currentFieldToGroup]

      // Handle null/undefined/empty values
      if (groupKey === null || groupKey === undefined || groupKey === '') {
        groupKey = unknownLabel
      } else {
        groupKey = String(groupKey)
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(item)
    }

    // Convert Map to array and process each group
    const groupEntries = Array.from(groups.entries())

    // Sort group keys if requested
    if (sortGroupKeys) {
      groupEntries.sort(([a], [b]) => {
        // Put "Unknown" at the end
        if (a === unknownLabel && b !== unknownLabel) return 1
        if (b === unknownLabel && a !== unknownLabel) return -1
        return a.localeCompare(b)
      })
    }

    return groupEntries.map(([groupKey, groupItems]) => {
      const displayKey = labelFormatter ? labelFormatter(groupKey, currentFieldToGroup) : groupKey

      return {
        field: currentFieldToGroup,
        key: displayKey,
        count: groupItems.length,
        children: groupRecursive(groupItems, nextFields, currentFieldToGroup)
      }
    })
  }

  return groupRecursive(workingData, fields) as GroupNode[]
}

/**
 * Flattens grouped data back to a flat array (useful for rendering)
 * @param groupedData - The grouped data structure
 * @param includeGroupHeaders - Whether to include group header objects
 * @returns Flattened array
 */
export function flattenGroupedData(groupedData: GroupNode[], includeGroupHeaders = true): any[] {
  const result: any[] = []

  function flattenRecursive(nodes: GroupNode[] | any[], level = 0) {
    if (!Array.isArray(nodes)) return

    for (const node of nodes) {
      if ('field' in node && 'key' in node && 'children' in node) {
        // This is a group node
        if (includeGroupHeaders) {
          result.push({
            _isGroupHeader: true,
            _level: level,
            _field: node.field,
            _key: node.key,
            _count: node.count,
            ...node
          })
        }

        // Recursively flatten children
        flattenRecursive(node.children, level + 1)
      } else {
        // This is a data item
        result.push({
          ...node,
          _isGroupHeader: false,
          _level: level
        })
      }
    }
  }

  flattenRecursive(groupedData)
  return result
}

/**
 * Gets unique values for a specific field from data (useful for filter options)
 * @param data - Array of objects
 * @param field - Field name to extract values from
 * @param includeUnknown - Whether to include "Unknown" for null/undefined values
 * @returns Array of unique values
 */
export function getUniqueFieldValues(data: any[], field: string, includeUnknown = true): string[] {
  const values = new Set<string>()

  for (const item of data) {
    let value = item[field]

    if (value === null || value === undefined || value === '') {
      if (includeUnknown) {
        values.add('Unknown')
      }
    } else {
      values.add(String(value))
    }
  }

  return Array.from(values).sort()
}

/**
 * Calculates statistics for grouped data
 * @param groupedData - The grouped data structure
 * @returns Statistics object
 */
export function getGroupStatistics(groupedData: GroupNode[]) {
  let totalGroups = 0
  let totalItems = 0
  let maxDepth = 0

  function analyzeRecursive(nodes: GroupNode[] | any[], depth = 0) {
    maxDepth = Math.max(maxDepth, depth)

    if (!Array.isArray(nodes)) return

    for (const node of nodes) {
      if ('field' in node && 'key' in node && 'children' in node) {
        totalGroups++
        analyzeRecursive(node.children, depth + 1)
      } else {
        totalItems++
      }
    }
  }

  analyzeRecursive(groupedData)

  return {
    totalGroups,
    totalItems,
    maxDepth,
    avgItemsPerGroup: totalGroups > 0 ? Math.round(totalItems / totalGroups) : 0
  }
}
