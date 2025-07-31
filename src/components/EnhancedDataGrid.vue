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

        <!-- Group by button -->
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-group"
              class="toolbar-btn"
              :color="groupByFields.length > 0 ? 'primary' : undefined"
            >
              {{ $t('common.groupBy') }}
              <v-chip v-if="groupByFields.length > 0" size="x-small" class="ml-1">{{
                groupByFields.length
              }}</v-chip>
            </v-btn>
          </template>
          <v-card min-width="320" @click.stop>
            <v-card-title class="text-subtitle-1">
              <v-icon start>mdi-group</v-icon>
              {{ $t('common.groupBy') }}
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-select
                v-model="groupByFields"
                :items="groupableColumns"
                item-title="title"
                item-value="key"
                :label="$t('common.selectColumns')"
                multiple
                chips
                closable-chips
                clearable
                variant="outlined"
                density="compact"
                :hint="
                  groupByFields.length === 0
                    ? $t('common.selectColumnsToGroup')
                    : $t('common.groupingByFields', { count: groupByFields.length })
                "
                persistent-hint
              />
              <div class="mt-3" v-if="groupByFields.length > 0">
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-expand-all"
                  @click="expandAllGroups"
                  class="mr-2"
                >
                  {{ $t('common.expandAll') }}
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-collapse-all"
                  @click="collapseAllGroups"
                >
                  {{ $t('common.collapseAll') }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
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

    <!-- Group sections (when grouping is active) -->
    <div v-if="groupByFields.length > 0" class="group-sections">
      <template v-for="group in groupedItems" :key="group.groupKey">
        <v-card class="group-section-card" variant="outlined" elevation="1">
          <v-card-title class="group-section-header">
            <v-btn
              variant="text"
              size="small"
              :prepend-icon="group.isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
              @click="toggleGroup(group.groupKey)"
              class="group-section-toggle"
            >
              <v-chip
                :color="getGroupFieldColor(groupByFields[0])"
                size="small"
                variant="tonal"
                class="mr-2"
              >
                {{ getGroupFieldLabel(groupByFields[0]) }}
              </v-chip>
              {{ group.groupValue }}
              <v-chip size="x-small" variant="outlined" class="ml-2">
                {{ group.count }} {{ group.count === 1 ? 'item' : 'items' }}
              </v-chip>
            </v-btn>
          </v-card-title>

          <!-- Group content (when expanded) -->
          <v-expand-transition>
            <div v-show="group.isExpanded">
              <v-divider />
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="displayHeaders"
                  :items="group.items"
                  :loading="loading"
                  :show-select="enableSelection"
                  :item-value="itemKeyField"
                  return-object
                  class="group-data-table"
                  density="compact"
                  hide-default-footer
                  :items-per-page="-1"
                  @click:row="onRowClick"
                >
                  <!-- Custom header for selection in groups -->
                  <template
                    v-if="enableSelection"
                    #[`header.data-table-select`]="{ props: headerProps }"
                  >
                    <div class="checkbox-column-header">
                      <v-checkbox
                        :model-value="isGroupAllSelected(group.items)"
                        :indeterminate="isGroupSomeSelected(group.items)"
                        @update:model-value="(value) => toggleGroupSelectAll(group.items, value)"
                        hide-details
                        density="compact"
                        color="primary"
                      />
                    </div>
                  </template>

                  <!-- Custom item selection in groups -->
                  <template v-if="enableSelection" #[`item.data-table-select`]="{ item }">
                    <div class="checkbox-column-item">
                      <v-checkbox
                        :model-value="selection.isSelected(item)"
                        @update:model-value="() => selection.toggleSelection(item)"
                        @click.stop
                        hide-details
                        density="compact"
                        color="primary"
                      />
                    </div>
                  </template>

                  <!-- Custom slot forwarding for group items -->
                  <template v-for="header in displayHeaders" #[`item.${header.key}`]="{ item }">
                    <slot :name="`item.${header.key}`" v-bind="{ item }">
                      {{ item[header.key] }}
                    </slot>
                  </template>
                </v-data-table>
              </v-card-text>
            </div>
          </v-expand-transition>
        </v-card>
      </template>
    </div>

    <!-- Group sections footer (when grouping is active) -->
    <v-card
      v-if="groupByFields.length > 0"
      class="group-sections-footer"
      variant="outlined"
      elevation="1"
    >
      <v-card-text class="text-center">
        <div class="footer-stats">
          <v-chip variant="tonal" size="small" class="mr-2">
            <v-icon start>mdi-group</v-icon>
            {{ groupedItems.length }} {{ groupedItems.length === 1 ? 'group' : 'groups' }}
          </v-chip>
          <v-chip variant="tonal" size="small" class="mr-2">
            <v-icon start>mdi-database</v-icon>
            {{ filteredAndSortedItems.length }}
            {{ filteredAndSortedItems.length === 1 ? 'item' : 'items' }} total
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Data table (when not grouping) -->
    <v-card v-else class="data-table-card" elevation="2">
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
        <!-- Custom header with popover filters -->
        <template v-for="header in displayHeaders" #[`header.${header.key}`]="{ column }">
          <div class="column-header-wrapper" :key="header.key">
            <!-- Show filter menu only for filterable columns -->
            <v-menu v-if="header.filterable !== false" :close-on-content-click="false" offset-y>
              <template v-slot:activator="{ props }">
                <div v-bind="props" class="column-header-clickable" @click.stop>
                  <div class="header-content">
                    <span class="header-title">{{ column.title }}</span>
                    <div class="header-indicators">
                      <!-- Sort indicator -->
                      <v-icon
                        v-if="getSortDirection(header.key)"
                        :color="getSortDirection(header.key) === 'asc' ? 'primary' : 'secondary'"
                        size="small"
                        class="sort-indicator"
                      >
                        {{
                          getSortDirection(header.key) === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
                        }}
                      </v-icon>
                      <!-- Filter indicator -->
                      <v-icon
                        v-if="hasActiveFilter(header.key) && header.filterable !== false"
                        color="primary"
                        size="small"
                        class="filter-indicator"
                      >
                        mdi-filter
                      </v-icon>
                      <!-- Filterable indicator for better UX -->
                      <v-icon
                        v-if="!hasActiveFilter(header.key) && header.filterable !== false"
                        color="surface-variant"
                        size="x-small"
                        class="filterable-indicator"
                        :title="$t('common.filterBy') + ' ' + column.title"
                      >
                        mdi-filter-variant
                      </v-icon>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Filter popover content -->
              <v-card min-width="280" class="filter-popover">
                <v-card-title class="filter-popover-title">
                  <v-icon start>mdi-filter</v-icon>
                  {{ $t('common.filter') }} {{ column.title }}
                </v-card-title>
                <v-divider />
                <v-card-text class="filter-content">
                  <!-- Text filter -->
                  <v-text-field
                    v-if="header.type === 'text' || !header.type"
                    v-model="columnFilters[header.key]"
                    :label="$t('common.filter')"
                    :placeholder="$t('common.enterValue')"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="filter-field"
                    @update:model-value="applyFilters"
                  />

                  <!-- Number range filter -->
                  <div v-else-if="header.type === 'number'" class="number-filter">
                    <v-text-field
                      :model-value="numberFilters[header.key]?.min"
                      @update:model-value="updateNumberFilter(header.key, 'min', $event)"
                      :label="$t('common.min')"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="number"
                      class="filter-field mb-2"
                    />
                    <v-text-field
                      :model-value="numberFilters[header.key]?.max"
                      @update:model-value="updateNumberFilter(header.key, 'max', $event)"
                      :label="$t('common.max')"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="number"
                      class="filter-field"
                    />
                  </div>

                  <!-- Boolean filter -->
                  <v-select
                    v-else-if="header.type === 'boolean'"
                    v-model="columnFilters[header.key]"
                    :items="booleanOptions"
                    :label="$t('common.filter')"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    class="filter-field"
                    @update:model-value="applyFilters"
                  />

                  <!-- Date range filter -->
                  <div v-else-if="header.type === 'date'" class="date-filter">
                    <v-text-field
                      :model-value="dateFilters[header.key]?.from"
                      @update:model-value="updateDateFilter(header.key, 'from', $event)"
                      :label="$t('common.from')"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="date"
                      class="filter-field mb-2"
                    />
                    <v-text-field
                      :model-value="dateFilters[header.key]?.to"
                      @update:model-value="updateDateFilter(header.key, 'to', $event)"
                      :label="$t('common.to')"
                      variant="outlined"
                      density="compact"
                      hide-details
                      type="date"
                      class="filter-field"
                    />
                  </div>

                  <!-- Clear filter button -->
                  <v-btn
                    v-if="hasActiveFilter(header.key)"
                    variant="text"
                    color="error"
                    size="small"
                    class="mt-3"
                    @click="clearColumnFilter(header.key)"
                  >
                    <v-icon start>mdi-close</v-icon>
                    {{ $t('common.clearFilter') }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-menu>
            <!-- Non-filterable header -->
            <div v-else class="column-header-simple">
              <div class="header-content">
                <span class="header-title">{{ column.title }}</span>
                <div class="header-indicators">
                  <!-- Sort indicator -->
                  <v-icon
                    v-if="getSortDirection(header.key)"
                    :color="getSortDirection(header.key) === 'asc' ? 'primary' : 'secondary'"
                    size="small"
                    class="sort-indicator"
                  >
                    {{ getSortDirection(header.key) === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Custom header for selection -->
        <template v-if="enableSelection" #[`header.data-table-select`]="{ props: headerProps }">
          <div class="checkbox-column-header">
            <v-checkbox
              :model-value="isAllSelected"
              :indeterminate="isSomeSelected"
              @update:model-value="toggleSelectAll"
              hide-details
              density="compact"
              color="primary"
            />
          </div>
        </template>

        <!-- Custom item selection -->
        <template v-if="enableSelection" #[`item.data-table-select`]="{ item }">
          <div class="checkbox-column-item">
            <v-checkbox
              :model-value="selection.isSelected(item)"
              @update:model-value="() => selection.toggleSelection(item)"
              @click.stop
              hide-details
              density="compact"
              color="primary"
            />
          </div>
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

        <!-- Footer with enhanced pagination (only when not grouping) -->
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
import { useRouter, useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import { ExportUtils, type ExportColumn } from '@/utils/exportUtils'
import { useTableSelection } from '@/composables/useTableSelection'
import { useGroupBy } from '@/composables/useGroupBy'
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

interface NumberFilter {
  min?: number
  max?: number
}

interface DateFilter {
  from?: string
  to?: string
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
const router = useRouter()
const route = useRoute()

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

// Filtering
const columnFilters = ref<Record<string, string>>({})
const numberFilters = ref<Record<string, NumberFilter>>({})
const dateFilters = ref<Record<string, DateFilter>>({})

// Group by functionality
const groupByFields = ref<string[]>([])
const { displayItems, groupedItems, toggleGroup, expandAll, collapseAll } = useGroupBy({
  items: computed(() => filteredAndSortedItems.value),
  groupByFields: computed(() => groupByFields.value)
})

// Boolean filter options
const booleanOptions = [
  { title: t('common.yes'), value: 'true' },
  { title: t('common.no'), value: 'false' }
]

// Computed properties
const allColumns = computed(() => props.columns.filter((col) => !col.hidden))

// Groupable columns (exclude actions and non-sortable columns)
const groupableColumns = computed(() => {
  return props.columns
    .filter((col) => !col.hidden && col.key !== 'actions' && col.sortable !== false)
    .map((col) => ({
      title: col.title,
      key: col.key
    }))
})

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
  let result = [...props.items]

  // Apply text filters
  Object.entries(columnFilters.value).forEach(([key, filterValue]) => {
    if (filterValue && filterValue.trim()) {
      const column = props.columns.find((col) => col.key === key)

      if (column?.type === 'boolean') {
        const boolValue = filterValue === 'true'
        result = result.filter((item) => Boolean(item[key]) === boolValue)
      } else {
        const searchTerm = filterValue?.toLowerCase()
        result = result.filter((item) => {
          const value = item[key]
          return value != null && String(value)?.toLowerCase().includes(searchTerm)
        })
      }
    }
  })

  // Apply number filters
  Object.entries(numberFilters.value).forEach(([key, filter]) => {
    if (filter.min !== undefined || filter.max !== undefined) {
      result = result.filter((item) => {
        const value = Number(item[key])
        if (isNaN(value)) return false

        if (filter.min !== undefined && value < filter.min) return false
        if (filter.max !== undefined && value > filter.max) return false

        return true
      })
    }
  })

  // Apply date filters
  Object.entries(dateFilters.value).forEach(([key, filter]) => {
    if (filter.from || filter.to) {
      result = result.filter((item) => {
        const value = item[key]
        if (!value) return false

        const itemDate = new Date(value)
        if (filter.from && itemDate < new Date(filter.from)) return false
        if (filter.to && itemDate > new Date(filter.to)) return false

        return true
      })
    }
  })

  return result
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

// Group selection helpers
const isGroupAllSelected = (groupItems: any[]) => {
  return groupItems.length > 0 && groupItems.every((item) => selection.isSelected(item))
}

const isGroupSomeSelected = (groupItems: any[]) => {
  const selectedCount = groupItems.filter((item) => selection.isSelected(item)).length
  return selectedCount > 0 && selectedCount < groupItems.length
}

const toggleGroupSelectAll = (groupItems: any[], value: boolean) => {
  if (value) {
    groupItems.forEach((item) => {
      if (!selection.isSelected(item)) {
        selection.toggleSelection(item)
      }
    })
  } else {
    groupItems.forEach((item) => {
      if (selection.isSelected(item)) {
        selection.toggleSelection(item)
      }
    })
  }
}

// URL filter sync utilities
const initializeFiltersFromURL = () => {
  const query = route.query

  // Initialize text filters
  Object.keys(query).forEach((key) => {
    if (key.startsWith('filter_') && typeof query[key] === 'string') {
      const columnKey = key.replace('filter_', '')
      columnFilters.value[columnKey] = query[key] as string
    }
  })

  // Initialize number filters
  Object.keys(query).forEach((key) => {
    if (key.startsWith('min_') && typeof query[key] === 'string') {
      const columnKey = key.replace('min_', '')
      if (!numberFilters.value[columnKey]) numberFilters.value[columnKey] = {}
      numberFilters.value[columnKey].min = Number(query[key])
    }
    if (key.startsWith('max_') && typeof query[key] === 'string') {
      const columnKey = key.replace('max_', '')
      if (!numberFilters.value[columnKey]) numberFilters.value[columnKey] = {}
      numberFilters.value[columnKey].max = Number(query[key])
    }
  })

  // Initialize date filters
  Object.keys(query).forEach((key) => {
    if (key.startsWith('from_') && typeof query[key] === 'string') {
      const columnKey = key.replace('from_', '')
      if (!dateFilters.value[columnKey]) dateFilters.value[columnKey] = {}
      dateFilters.value[columnKey].from = query[key] as string
    }
    if (key.startsWith('to_') && typeof query[key] === 'string') {
      const columnKey = key.replace('to_', '')
      if (!dateFilters.value[columnKey]) dateFilters.value[columnKey] = {}
      dateFilters.value[columnKey].to = query[key] as string
    }
  })

  // Initialize group by fields
  const groupByParam = query.groupBy
  if (groupByParam) {
    const groupFields = Array.isArray(groupByParam) ? groupByParam : [groupByParam]
    groupByFields.value = groupFields.filter((field) => typeof field === 'string') as string[]
  }
}

const syncFiltersToURL = () => {
  const query: Record<string, string | string[]> = Object.fromEntries(
    Object.entries(route.query).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value ?? ''
    ])
  )

  // Remove existing filter params
  Object.keys(query).forEach((key) => {
    if (
      key.startsWith('filter_') ||
      key.startsWith('min_') ||
      key.startsWith('max_') ||
      key.startsWith('from_') ||
      key.startsWith('to_') ||
      key === 'groupBy'
    ) {
      delete query[key]
    }
  })

  // Add text filters
  Object.entries(columnFilters.value).forEach(([key, value]) => {
    if (value && value.trim()) {
      query[`filter_${key}`] = value
    }
  })

  // Add number filters
  Object.entries(numberFilters.value).forEach(([key, filter]) => {
    if (filter.min !== undefined) {
      query[`min_${key}`] = String(filter.min)
    }
    if (filter.max !== undefined) {
      query[`max_${key}`] = String(filter.max)
    }
  })

  // Add date filters
  Object.entries(dateFilters.value).forEach(([key, filter]) => {
    if (filter.from) {
      query[`from_${key}`] = filter.from
    }
    if (filter.to) {
      query[`to_${key}`] = filter.to
    }
  })

  // Add group by fields
  if (groupByFields.value.length > 0) {
    query.groupBy = groupByFields.value
  }

  // Update URL without triggering navigation
  router.replace({ query })
}

// Filter utilities
const hasActiveFilter = (columnKey: string): boolean => {
  return !!(
    columnFilters.value[columnKey] ||
    numberFilters.value[columnKey]?.min !== undefined ||
    numberFilters.value[columnKey]?.max !== undefined ||
    dateFilters.value[columnKey]?.from ||
    dateFilters.value[columnKey]?.to
  )
}

const applyFilters = () => {
  currentPage.value = 1
  syncFiltersToURL()
}

const updateNumberFilter = (columnKey: string, type: 'min' | 'max', value: any) => {
  if (!numberFilters.value[columnKey]) {
    numberFilters.value[columnKey] = {}
  }
  numberFilters.value[columnKey][type] = value ? Number(value) : undefined
  applyFilters()
}

const updateDateFilter = (columnKey: string, type: 'from' | 'to', value: any) => {
  if (!dateFilters.value[columnKey]) {
    dateFilters.value[columnKey] = {}
  }
  dateFilters.value[columnKey][type] = value || undefined
  applyFilters()
}

// Filter utilities
const clearColumnFilter = (columnKey: string) => {
  delete columnFilters.value[columnKey]
  delete numberFilters.value[columnKey]
  delete dateFilters.value[columnKey]
  applyFilters()
}

// Group by methods
const expandAllGroups = () => {
  expandAll()
}

const collapseAllGroups = () => {
  collapseAll()
}

// Group field utilities
const getGroupFieldLabel = (field: string): string => {
  const fieldLabels: Record<string, string> = {
    status: 'Status',
    site_id: 'Site',
    manufacturer: 'Manufacturer',
    model: 'Model',
    connector_count: 'Connectors',
    charge_point_id: 'Charge Point',
    created: 'Created Date'
  }
  return fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1)
}

const getGroupFieldColor = (field: string): string => {
  const fieldColors: Record<string, string> = {
    status: 'primary',
    site_id: 'secondary',
    manufacturer: 'success',
    model: 'warning',
    connector_count: 'info',
    charge_point_id: 'purple',
    created: 'teal'
  }
  return fieldColors[field] || 'grey'
}

const getSortDirection = (columnKey: string): string | null => {
  if (!Array.isArray(sortBy.value)) return null
  const sortItem = sortBy.value.find((item: any) => item.key === columnKey)
  return sortItem ? sortItem.order || 'asc' : null
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
  columnFilters.value = {}
  numberFilters.value = {}
  dateFilters.value = {}
  groupByFields.value = []
  syncFiltersToURL()
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

// Initialize number and date filters
watch(
  () => props.columns,
  (newColumns) => {
    newColumns.forEach((column) => {
      if (column.type === 'number' && !numberFilters.value[column.key]) {
        numberFilters.value[column.key] = {}
      }
      if (column.type === 'date' && !dateFilters.value[column.key]) {
        dateFilters.value[column.key] = {}
      }
    })
  },
  { immediate: true }
)

// Watch group by fields changes and sync to URL
watch(
  groupByFields,
  () => {
    syncFiltersToURL()
  },
  { deep: true }
)

onMounted(() => {
  loadSettings()
  initializeFiltersFromURL()
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

/* Checkbox column spacing */
.checkbox-column-header,
.checkbox-column-item {
  padding-right: 16px;
}

/* Column header styles for filtering */
.column-header-wrapper {
  width: 100%;
}

.column-header-simple {
  padding: 8px 4px;
  width: 100%;
}

.column-header-clickable {
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.column-header-clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  flex: 1;
}

.header-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.sort-indicator,
.filter-indicator,
.filterable-indicator {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.sort-indicator:hover,
.filter-indicator:hover,
.filterable-indicator:hover {
  opacity: 1;
}

.filterable-indicator {
  opacity: 0.4;
}

.filterable-indicator:hover {
  opacity: 0.7;
}

.filter-popover {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filter-popover-title {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 12px 16px 8px;
}

.filter-content {
  padding: 16px;
}

.filter-field {
  width: 100%;
}

.number-filter,
.date-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

/* Group by styles */
.group-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.group-section-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.group-section-card:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
}

.group-section-header {
  background: rgba(var(--v-theme-primary), 0.04);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.2);
}

.group-section-toggle {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-transform: none;
  justify-content: flex-start;
  min-width: auto;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.group-section-toggle:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.group-data-table {
  border-radius: 0;
}

.group-data-table ::deep(.v-data-table__wrapper) {
  border-radius: 0;
}

.group-data-table ::deep(.v-data-table-header) {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.group-sections-footer {
  margin-top: 16px;
  border-radius: 12px;
}

.footer-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Responsive adjustments for filters */
@media (max-width: 768px) {
  .filter-popover {
    max-width: 90vw;
  }

  .filter-content {
    padding: 12px;
  }

  .column-header-clickable {
    padding: 6px 2px;
  }

  .header-title {
    font-size: 0.8rem;
  }
}
</style>
