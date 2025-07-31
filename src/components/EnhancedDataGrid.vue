<template>
  <div class="enhanced-data-grid">
    <!-- Main toolbar -->
    <div class="toolbar-main">
      <div class="toolbar-left">
        <!-- Column visibility button -->
        <v-menu :close-on-content-click="false" offset-y>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-view-column"
              class="toolbar-btn"
            >
              {{ $t('common.columns') }}
            </v-btn>
          </template>
          <v-card min-width="280" @click.stop>
            <v-card-title class="text-subtitle-1">
              <v-icon start>mdi-view-column</v-icon>
              {{ $t('common.selectColumns') }}
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="column-checkboxes">
                <v-checkbox
                  v-for="column in allColumns"
                  :key="column.key"
                  v-model="visibleColumns"
                  :value="column.key"
                  :label="column.title"
                  density="compact"
                  hide-details
                  class="column-checkbox"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Export button -->
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-download"
              class="toolbar-btn"
            >
              {{ $t('common.export') }}
            </v-btn>
          </template>
          <v-list class="export-menu">
            <v-list-subheader class="export-subheader">
              {{ $t('common.export') }} ({{ filteredAndSortedItems.length }}
              {{ $t('common.items') }})
            </v-list-subheader>
            <v-list-item @click="exportData('pdf')" class="export-item">
              <template v-slot:prepend>
                <v-icon color="red">mdi-file-pdf-box</v-icon>
              </template>
              <v-list-item-title>{{ $t('export.exportToPdf') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="exportData('excel')" class="export-item">
              <template v-slot:prepend>
                <v-icon color="green">mdi-file-excel</v-icon>
              </template>
              <v-list-item-title>{{ $t('export.exportToExcel') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="exportData('csv')" class="export-item">
              <template v-slot:prepend>
                <v-icon color="blue">mdi-file-delimited</v-icon>
              </template>
              <v-list-item-title>{{ $t('export.exportToCsv') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>


        <!-- Settings button -->
        <v-tooltip :text="$t('common.settings')" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              @click="showSettings = true"
              icon="mdi-cog"
              class="toolbar-btn"
              :aria-label="$t('common.settings')"
            >
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- Data table -->
    <v-card class="data-table-card" elevation="2">
      <v-data-table
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        v-model:sort-by="sortBy"
        :headers="displayHeaders"
        :items="filteredAndSortedItems"
        :loading="loading"
        :show-select="enableSelection"
        :item-key="itemKeyField"
        return-object
        class="enhanced-data-table"
        @click:row="onRowClick"
      >
        <!-- Custom header for selection -->
        <template v-if="enableSelection" #[`header.data-table-select`]="{ props: headerProps }">
          <v-checkbox
            :model-value="isAllSelected"
            :indeterminate="isSomeSelected"
            @update:model-value="toggleSelectAll"
            hide-details
            density="compact"
            color="primary"
          />
        </template>

        <!-- Custom item selection -->
        <template v-if="enableSelection" #[`item.data-table-select`]="{ item }">
          <v-checkbox
            :model-value="selection.isSelected(item)"
            @update:model-value="() => selection.toggleSelection(item)"
            @click.stop
            hide-details
            density="compact"
            color="primary"
          />
        </template>

        <!-- Custom slot forwarding -->
        <template v-for="header in displayHeaders" #[`item.${header.key}`]="{ item }">
          <slot :name="`item.${header.key}`" v-bind="{ item }">
            {{ item[header.key] }}
          </slot>
        </template>

        <!-- Forward all other slots -->
        <template v-for="(_, slot) in $slots" #[slot]="scope">
          <slot :name="slot" v-bind="scope" />
        </template>

        <!-- Footer with enhanced pagination -->
        <template #bottom>
          <div class="table-footer">
            <div class="footer-info">
              <span class="text-caption">
                {{
                  $t('table.showingItems', {
                    start: (currentPage - 1) * itemsPerPage + 1,
                    end: Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length),
                    total: filteredAndSortedItems.length
                  })
                }}
              </span>
            </div>
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="7"
              size="small"
            />
            <v-select
              v-model="itemsPerPage"
              :items="[10, 25, 50, 100]"
              :label="$t('table.itemsPerPage')"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 100px"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="600px">
      <v-card>
        <v-card-title>{{ $t('common.tableSettings') }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <h3>{{ $t('common.columnOrder') }}</h3>
              <div v-if="allColumns.length === 0" class="no-columns-message">
                <v-alert type="info" variant="tonal" density="compact">
                  {{ $t('common.noColumnsAvailable') }}
                </v-alert>
              </div>
              <draggable
                v-else
                v-model="columnOrder"
                group="columns"
                item-key="key"
                class="column-order-list"
                :animation="200"
                handle=".drag-handle"
              >
                <template #item="{ element }">
                  <div class="column-order-item">
                    <v-icon class="drag-handle">mdi-drag</v-icon>
                    <v-checkbox
                      v-model="visibleColumns"
                      :value="element.key"
                      :label="element.title"
                      hide-details
                      class="flex-grow-1"
                    />
                  </div>
                </template>
              </draggable>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resetSettings">{{ $t('common.reset') }}</v-btn>
          <v-btn color="primary" @click="saveSettings">{{ $t('common.save') }}</v-btn>
          <v-btn color="primary" @click="showSettings = false">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Selection Toolbar -->
    <SelectionToolbar
      v-if="enableSelection"
      :selected-items="selection.selectedItems.value"
      :loading="selectionLoading"
      :delete-loading="deleteLoading"
      :delete-progress="deleteProgress"
      @export="handleSelectionExport"
      @delete="handleSelectionDelete"
      @clear="selection.clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import { ExportUtils, type ExportColumn } from '@/utils/exportUtils'
import { useTableSelection } from '@/composables/useTableSelection'
import SelectionToolbar from './SelectionToolbar.vue'

interface Props {
  items: any[]
  columns: DataGridColumn[]
  loading?: boolean
  itemKey?: string
  tableKey?: string
  enableSelection?: boolean
  selectionLoading?: boolean
  deleteLoading?: boolean
  deleteProgress?: number
}

interface DataGridColumn {
  title: string
  key: string
  sortable?: boolean
  width?: string | number
  type?: 'text' | 'number' | 'date' | 'boolean'
  hidden?: boolean
  filterable?: boolean
}

interface Emits {
  (e: 'row-click', item: any): void
  (e: 'selection-change', selectedItems: any[]): void
  (e: 'export-selected', format: 'pdf' | 'excel' | 'csv', items: any[]): void
  (e: 'delete-selected', items: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  itemKey: 'id',
  tableKey: 'default',
  enableSelection: true,
  selectionLoading: false,
  deleteLoading: false,
  deleteProgress: 0
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Selection management
const selection = useTableSelection(
  props.itemKey,
  (selectedItems) => emit('selection-change', selectedItems),
  (selectedItems) => emit('delete-selected', selectedItems)
)

// Reactive state
const itemsPerPage = ref(25)
const currentPage = ref(1)
const sortBy = ref([])
const showSettings = ref(false)

// Column management
const visibleColumns = ref<string[]>([])
const columnOrder = ref<DataGridColumn[]>([])

// Computed properties
const allColumns = computed(() => props.columns.filter((col) => !col.hidden))

const displayHeaders = computed(() => {
  const availableColumns = props.columns.filter((col) => !col.hidden)
  const orderedHeaders = columnOrder.value.length > 0 ? columnOrder.value : availableColumns
  return orderedHeaders
    .filter((header) => visibleColumns.value.includes(header.key))
    .map((header) => ({
      ...header,
      sortable: header.sortable !== false
    }))
})

const itemKeyField = computed(() => {
  if (!props.items.length) return props.itemKey

  const first = props.items[0]
  const possibleKeys = ['id', 'site_id', 'charge_point_id', 'charging_profile_id', 'connector_id']

  for (const key of possibleKeys) {
    if (first[key] !== undefined) return key
  }

  return props.itemKey
})

const filteredAndSortedItems = computed(() => {
  return [...props.items]
})

const totalPages = computed(() =>
  Math.ceil(filteredAndSortedItems.value.length / itemsPerPage.value)
)

// Selection computed properties
const isAllSelected = computed(() => selection.isAllSelected(filteredAndSortedItems.value))

const isSomeSelected = computed(() => selection.isSomeSelected(filteredAndSortedItems.value))

// Methods
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selection.clearSelection()
  } else {
    selection.selectAll(filteredAndSortedItems.value)
  }
}

const handleSelectionExport = (format: 'pdf' | 'excel' | 'csv') => {
  emit('export-selected', format, selection.selectedItems.value)
}

const handleSelectionDelete = () => {
  selection.deleteSelected(selection.selectedItems.value)
}

// Export methods
const exportData = async (format: 'pdf' | 'excel' | 'csv') => {
  const exportColumns: ExportColumn[] = displayHeaders.value.map((header) => ({
    key: header.key,
    title: header.title,
    type: header.type
  }))

  const options = {
    filename: `export_${props.tableKey}_${new Date().toISOString().split('T')[0]}.${
      format === 'excel' ? 'xlsx' : format
    }`,
    title: `${props.tableKey} Export`,
    columns: exportColumns,
    data: filteredAndSortedItems.value
  }

  try {
    switch (format) {
      case 'pdf':
        await ExportUtils.exportToPDF(options)
        break
      case 'excel':
        await ExportUtils.exportToExcel(options)
        break
      case 'csv':
        await ExportUtils.exportToCSV(options)
        break
    }
  } catch (error) {
    console.error(`Export ${format} error:`, error)
  }
}

// Settings methods
const saveSettings = () => {
  const preferences = {
    visibleColumns: visibleColumns.value,
    columnOrder: columnOrder.value,
    itemsPerPage: itemsPerPage.value
  }
  localStorage.setItem(`table-preferences-${props.tableKey}`, JSON.stringify(preferences))
  showSettings.value = false
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(`table-preferences-${props.tableKey}`)
    if (saved) {
      const preferences = JSON.parse(saved)
      if (preferences.visibleColumns) visibleColumns.value = preferences.visibleColumns
      if (preferences.columnOrder) columnOrder.value = preferences.columnOrder
      if (preferences.itemsPerPage) itemsPerPage.value = preferences.itemsPerPage
    }
  } catch (error) {
    console.warn('Failed to load table preferences:', error)
  }
}

const resetSettings = () => {
  visibleColumns.value = props.columns.filter((h) => !h.hidden).map((h) => h.key)
  columnOrder.value = [...props.columns].filter((col) => !col.hidden)
  itemsPerPage.value = 25
}

// Event handlers
const onRowClick = (event: any, { item }: { item: any }) => {
  emit('row-click', item)
}

// Watchers
watch(
  () => props.columns,
  (newColumns) => {
    const availableColumns = newColumns.filter((h) => !h.hidden)

    if (visibleColumns.value.length === 0 && availableColumns.length > 0) {
      visibleColumns.value = availableColumns.map((h) => h.key)
    }

    if (columnOrder.value.length === 0 && availableColumns.length > 0) {
      columnOrder.value = [...availableColumns]
    }

    if (availableColumns.length > 0) {
      const existingKeys = columnOrder.value.map((col) => col.key)
      const newCols = availableColumns.filter((col) => !existingKeys.includes(col.key))
      if (newCols.length > 0) {
        columnOrder.value = [...columnOrder.value, ...newCols]
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.enhanced-data-grid {
  width: 100%;
}

.toolbar-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
  padding: 5px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-btn {
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;
  box-shadow: none;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.toolbar-btn:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.data-table-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.column-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.column-checkbox {
  border-radius: 6px;
  padding: 4px 8px;
}

.column-checkbox:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.export-menu {
  border-radius: 8px;
  overflow: hidden;
}

.export-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.export-subheader {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  text-transform: uppercase;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.no-columns-message {
  margin: 16px 0;
}

.column-order-list {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.column-order-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  cursor: move;
}

.column-order-item:last-child {
  border-bottom: none;
}

.drag-handle {
  margin-right: 12px;
  color: rgb(var(--v-theme-on-surface));
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .toolbar-main {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    justify-content: center;
  }

  .table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-info {
    justify-content: center;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .toolbar-left {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
</style>
