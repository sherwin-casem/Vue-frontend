import { ref, computed, type Ref } from 'vue'

export interface SelectionState<T = any> {
  selectedItems: Ref<T[]>
  isSelected: (item: T) => boolean
  selectItem: (item: T) => void
  deselectItem: (item: T) => void
  toggleSelection: (item: T) => void
  selectAll: (items: T[]) => void
  clearSelection: () => void
  selectRange: (items: T[], startIndex: number, endIndex: number) => void
  getSelectionCount: () => number
  isAllSelected: (items: T[]) => boolean
  isSomeSelected: (items: T[]) => boolean
  deleteSelected: (items: T[]) => void
}

export function useTableSelection<T = any>(
  itemKeyField: string = 'id',
  onSelectionChange?: (items: T[]) => void,
  onDeleteSelected?: (items: T[]) => void
): SelectionState<T> {
  const selectedItems = ref<T[]>([]) as Ref<T[]>

  const getItemKey = (item: T): any => {
    return (item as any)[itemKeyField]
  }

  const isSelected = (item: T): boolean => {
    const itemKey = getItemKey(item)
    return selectedItems.value.some((selected) => getItemKey(selected) === itemKey)
  }

  const selectItem = (item: T): void => {
    if (!isSelected(item)) {
      selectedItems.value = [...selectedItems.value, item]
      onSelectionChange?.(selectedItems.value)
    }
  }

  const deselectItem = (item: T): void => {
    const itemKey = getItemKey(item)
    selectedItems.value = selectedItems.value.filter((selected) => getItemKey(selected) !== itemKey)
    onSelectionChange?.(selectedItems.value)
  }

  const toggleSelection = (item: T): void => {
    if (isSelected(item)) {
      deselectItem(item)
    } else {
      selectItem(item)
    }
  }

  const selectAll = (items: T[]): void => {
    selectedItems.value = [...items]
    onSelectionChange?.(selectedItems.value)
  }

  const clearSelection = (): void => {
    selectedItems.value = []
    onSelectionChange?.(selectedItems.value)
  }

  const selectRange = (items: T[], startIndex: number, endIndex: number): void => {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    const rangeItems = items.slice(start, end + 1)

    // Add range items to selection (avoiding duplicates)
    const newSelection = [...selectedItems.value]
    rangeItems.forEach((item) => {
      if (!isSelected(item)) {
        newSelection.push(item)
      }
    })

    selectedItems.value = newSelection
    onSelectionChange?.(selectedItems.value)
  }

  const getSelectionCount = (): number => {
    return selectedItems.value.length
  }

  const isAllSelected = (items: T[]): boolean => {
    if (items.length === 0) return false
    return items.every((item) => isSelected(item))
  }

  const isSomeSelected = (items: T[]): boolean => {
    return items.some((item) => isSelected(item)) && !isAllSelected(items)
  }

  const deleteSelected = (items: T[]): void => {
    onDeleteSelected?.(items)
  }

  return {
    selectedItems,
    isSelected,
    selectItem,
    deselectItem,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    getSelectionCount,
    isAllSelected,
    isSomeSelected,
    deleteSelected
  }
}
