<template>
  <div class="hierarchical-data-grid">
    <!-- Enhanced Data Grid with expandable rows -->
    <EnhancedDataGrid
      v-bind="$attrs"
      :columns="displayColumns"
      :items="items"
      :loading="loading"
      :table-key="tableKey"
      :enable-selection="enableSelection"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
      @export-selected="handleExportSelected"
      @delete-selected="handleDeleteSelected"
    >
          <!-- Expandable column -->
      <template #item.expand="{ item }">
        <div class="expand-cell">
          <v-btn
            v-if="hasChildren(item)"
            :icon="isExpanded(item) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
            variant="text"
            size="small"
            color="primary"
            @click.stop="toggleExpand(item)"
            :loading="isLoadingChildren(item)"
            :aria-label="isExpanded(item) ? $t('common.collapse') : $t('common.expand')"
          />
        </div>
      </template>

      <!-- Forward all slots from parent except the expandable column -->
      <template v-for="(_, slot) in $slots" #[slot]="scope" :key="slot">
        <slot
          v-if="slot !== 'item.expand' && slot !== 'expand-content'"
          :name="slot"
          v-bind="scope"
        />
      </template>


      <!-- Custom row rendering with expansion -->
      <template #item="{ item, index }">
        <tr
          class="parent-row"
          :class="{ expanded: isExpanded(item) }"
          @click="handleRowClick(item)"
        >
          <!-- Render all columns -->
          <td
            v-for="column in displayColumns"
            :key="column.key"
            :style="{ width: column.width ? `${column.width}px` : 'auto' }"
            class="parent-cell"
          >
            <slot :name="`item.${column.key}`" :item="item" :index="index">
              {{ item[column.key] }}
            </slot>
          </td>
        </tr>

        <!-- Expandable row content -->
        <tr v-if="isExpanded(item)" class="child-row">
          <td :colspan="displayColumns.length" class="child-cell">
            <v-expand-transition>
              <div class="child-content">
                <slot
                  name="expand-content"
                  :item="item"
                  :children="getChildren(item)"
                  :loading="isLoadingChildren(item)"
                  :refresh="() => refreshChildren(item)"
                />
              </div>
            </v-expand-transition>
          </td>
        </tr>
      </template>
    </EnhancedDataGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EnhancedDataGrid from './EnhancedDataGrid.vue'

interface Props {
  items: any[]
  columns: any[]
  loading?: boolean
  tableKey?: string
  enableSelection?: boolean
  expandColumn?: {
    title?: string
    width?: number
    position?: 'start' | 'end'
  }
  expandedItems?: Set<any>
  childrenData?: Map<any, any[]>
  childrenLoading?: Set<any>
  hasChildrenFn?: (item: any) => boolean
}

interface Emits {
  (e: 'row-click', item: any): void
  (e: 'selection-change', selectedItems: any[]): void
  (e: 'export-selected', format: 'pdf' | 'excel' | 'csv', items: any[]): void
  (e: 'delete-selected', items: any[]): void
  (e: 'expand', item: any): void
  (e: 'collapse', item: any): void
  (e: 'load-children', item: any): void
  (e: 'refresh-children', item: any): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  tableKey: 'hierarchical',
  enableSelection: true,
  expandColumn: () => ({
    title: '',
    width: 50,
    position: 'start'
  }),
  expandedItems: () => new Set(),
  childrenData: () => new Map(),
  childrenLoading: () => new Set(),
  hasChildrenFn: () => true
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed properties
const displayColumns = computed(() => {
  const expandCol = {
    key: 'expand',
    title: props.expandColumn?.title || '',
    width: props.expandColumn?.width || 50,
    sortable: false,
    filterable: false,
    type: 'text' as const
  }

  if (props.expandColumn?.position === 'end') {
    return [...props.columns, expandCol]
  } else {
    return [expandCol, ...props.columns]
  }
})

// Expansion state management
const isExpanded = (item: any): boolean => {
  return props.expandedItems.has(item)
}

const hasChildren = (item: any): boolean => {
  return props.hasChildrenFn(item)
}

const isLoadingChildren = (item: any): boolean => {
  return props.childrenLoading.has(item)
}

const getChildren = (item: any): any[] => {
  return props.childrenData.get(item) || []
}

const toggleExpand = (item: any) => {
  if (!hasChildren(item)) return

  if (isExpanded(item)) {
    emit('collapse', item)
  } else {
    emit('expand', item)
    if (!props.childrenData.has(item) || props.childrenData.get(item)?.length === 0) {
      emit('load-children', item)
    }
  }
}

const refreshChildren = (item: any) => {
  emit('refresh-children', item)
}

// Event handlers
const handleRowClick = (item: any) => {
  emit('row-click', item)
  toggleExpand(item)
}

const handleSelectionChange = (selectedItems: any[]) => {
  emit('selection-change', selectedItems)
}

const handleExportSelected = (format: 'pdf' | 'excel' | 'csv', items: any[]) => {
  emit('export-selected', format, items)
}

const handleDeleteSelected = (items: any[]) => {
  emit('delete-selected', items)
}
</script>

<style scoped>
.hierarchical-data-grid {
  width: 100%;
}

.expand-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 40px;
}

.parent-row {
  transition: background-color 0.2s ease;
}

.parent-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.parent-row.expanded {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.parent-cell {
  vertical-align: middle;
  padding: 8px 12px;
}

.child-row {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.child-cell {
  padding: 0;
  border-top: none;
}

.child-content {
  padding: 16px 20px;
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-surface), 0.95);
  margin: 0 8px 8px 8px;
  border-radius: 0 8px 8px 0;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .child-content {
    padding: 12px 16px;
    margin: 0 4px 4px 4px;
  }

  .parent-cell {
    padding: 6px 8px;
  }

  .expand-cell {
    min-height: 36px;
  }
}
</style>
