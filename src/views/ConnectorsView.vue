<template>
  <div class="connectors-view">
    <v-container fluid>
      <v-row>
        <v-col>
          <h1 class="page-title">{{ $t('connectors.title') }}</h1>

          <!-- Global Search and Actions -->
          <div class="grid-toolbar">
            <v-text-field
              v-model="globalSearch"
              :label="$t('common.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              style="max-width: 300px"
              @input="onGlobalSearchChange"
            />

            <div class="toolbar-actions">
              <v-btn
                v-if="selectedItems.length > 0"
                color="error"
                variant="outlined"
                @click="deleteSelected"
                :disabled="loading"
              >
                <v-icon left>mdi-delete</v-icon>
                {{ $t('common.deleteSelected') }} ({{ selectedItems.length }})
              </v-btn>

              <v-menu v-if="selectedItems.length > 0" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn color="primary" variant="outlined" :disabled="loading" v-bind="props">
                    <v-icon left>mdi-export</v-icon>
                    {{ $t('common.export') }}
                    <v-icon right>mdi-chevron-down</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="exportSelected('xlsx')">
                    <v-list-item-title>Export to Excel</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="exportSelected('pdf')">
                    <v-list-item-title>Export to PDF</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-btn color="primary" @click="showCreateDialog = true" :disabled="loading">
                <v-icon left>mdi-plus</v-icon>
                {{ $t('connectors.create') }}
              </v-btn>
            </div>
          </div>

          <!-- Kendo Grid -->
          <div class="grid-container">
            <Grid
              ref="gridRef"
              :style="{ height: '600px' }"
              :data-items="processedData"
              :columns="columns"
              :sortable="true"
              :groupable="true"
              :reorderable="true"
              :pageable="pageableConfig"
              :filterable="false"
              :selected-field="'selected'"
              :take="take"
              :skip="skip"
              :total="total"
              :group="group"
              :sort="sort"
              :filter="filter"
              :loader="loading"
              @datastatechange="onDataStateChange"
              @selectionchange="onSelectionChange"
            >
              <!-- Select All Checkbox Template -->
              <template #selectAllTemplate="{ props }">
                <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
              </template>

              <!-- Checkbox Template -->
              <template #checkboxTemplate="{ props }">
                <input
                  type="checkbox"
                  :checked="props.dataItem?.selected || false"
                  @change="props.dataItem && toggleSelection(props.dataItem)"
                />
              </template>

              <!-- Status Template -->
              <template #statusTemplate="{ props }">
                <v-chip
                  v-if="props.dataItem"
                  :color="getStatusColor(props.dataItem.status)"
                  size="small"
                  class="status-chip"
                >
                  {{ props.dataItem.status }}
                </v-chip>
              </template>

              <!-- Actions Template -->
              <template #actionsTemplate="{ props }">
                <div v-if="props.dataItem" class="actions-cell">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewItem(props.dataItem)"
                  />
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="editItem(props.dataItem)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteItem(props.dataItem)"
                  />
                </div>
              </template>
            </Grid>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingItem ? $t('connectors.edit') : $t('connectors.create') }}
        </v-card-title>
        <v-card-text>
          <ConnectorForm
            :connector="editingItem"
            @save="onSaveConnector"
            @cancel="onCancelDialog"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="showViewDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ $t('connectors.view') }}</v-card-title>
        <v-card-text>
          <div v-if="viewingItem">
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('connectors.number') }}:</strong> {{ viewingItem.connector_number }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('connectors.type') }}:</strong> {{ viewingItem.type }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('connectors.maxPower') }}:</strong> {{ viewingItem.max_power_kw }} kW
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('connectors.status') }}:</strong>
                <v-chip :color="getStatusColor(viewingItem.status)" size="small">
                  {{ viewingItem.status }}
                </v-chip>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <strong>{{ $t('connectors.chargePoint') }}:</strong>
                {{ getChargePointOCPPId(viewingItem.charge_point_id) }}
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showViewDialog = false">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Simple Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <!-- Error Snackbar -->
    <v-snackbar v-model="errorSnackbar" color="error" timeout="5000">
      {{ error }}
      <template v-slot:actions>
        <v-btn variant="text" @click="errorSnackbar = false">
          {{ $t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Grid } from '@progress/kendo-vue-grid'
import { process } from '@progress/kendo-data-query'
import { useConnectorsStore } from '@/stores/connectors'
import { useChargePointsStore } from '@/stores/chargepoints'
import ConnectorForm from '@/components/ConnectorForm.vue'
import type { Connector } from '@/types/connectors'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Stores
const connectorsStore = useConnectorsStore()
const chargePointsStore = useChargePointsStore()

// Reactive data
const gridRef = ref()
const globalSearch = ref('')
const selectedItems = ref<Connector[]>([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingItem = ref<Connector | null>(null)
const viewingItem = ref<Connector | null>(null)
const errorSnackbar = ref(false)

// Grid state
const take = ref(10)
const skip = ref(0)
const group = ref([])
const sort = ref([])
const filter = ref({ logic: 'and' as const, filters: [] })

// Computed properties
const loading = computed(() => connectorsStore.loading || chargePointsStore.loading)
const error = computed(() => connectorsStore.error || chargePointsStore.error)
const connectors = computed(() => connectorsStore.allConnectors)
const total = computed(() => connectors.value.length)
const isAllSelected = computed(
  () => connectors.value.length > 0 && selectedItems.value.length === connectors.value.length
)

// Grid configuration
const pageableConfig = ref({
  buttonCount: 5,
  info: true,
  type: 'numeric',
  pageSizes: [5, 10, 20, 50],
  previousNext: true
})

// Format date helper
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB') // dd/mm/yyyy format
}

// Helper function to get charge point OCPP ID
const getChargePointOCPPId = (chargePointId: number): string => {
  const chargePoint = chargePointsStore.getChargePointById(chargePointId)
  return chargePoint?.ocpp_charge_box_id || `CP-${chargePointId}`
}

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'success'
    case 'faulted':
      return 'error'
    default:
      return 'default'
  }
}

// Main grid columns
const columns = ref([
  {
    field: 'selected',
    title: '',
    width: '50px',
    filterable: false,
    sortable: false,
    groupable: false,
    cell: 'checkboxTemplate',
    headerCell: 'selectAllTemplate'
  },
  {
    field: 'id',
    title: 'ID',
    width: '80px',
    columnMenu: true
  },
  {
    field: 'charge_point_id',
    title: 'Charge Point',
    columnMenu: true,
  },
  {
    field: 'connector_number',
    title: 'Connector #',
    width: '120px',
    columnMenu: true
  },
  {
    field: 'type',
    title: 'Type',
    columnMenu: true
  },
  {
    field: 'max_power_kw',
    title: 'Max Power (kW)',
    width: '140px',
    columnMenu: true
  },
  {
    field: 'status',
    title: 'Status',
    width: '120px',
    columnMenu: true,
    cell: 'statusTemplate'
  },
  {
    field: 'created_at',
    title: 'Created',
    columnMenu: true,
    format: '{0:dd/MM/yyyy}',
  },
  {
    title: 'Actions',
    width: '150px',
    filterable: false,
    sortable: false,
    groupable: false,
    cell: 'actionsTemplate'
  }
])

// Process data for grid
const processedData = computed(() => {
  let data = connectors.value
    .filter((connector) => connector && typeof connector === 'object')
    .map((connector) => ({
      ...connector,
      selected: selectedItems.value.some((item) => item.id === connector.id),
      // Ensure all required fields exist
      created_at: connector.created_at || '',
      updated_at: connector.updated_at || ''
    }))

  // Apply global search
  if (globalSearch.value) {
    const searchTerm = globalSearch.value.toLowerCase()
    data = data.filter(
      (connector) =>
        connector.type?.toLowerCase().includes(searchTerm) ||
        connector.connector_number.toString().includes(searchTerm) ||
        connector.status?.toLowerCase().includes(searchTerm) ||
        connector.max_power_kw.toString().includes(searchTerm) ||
        getChargePointOCPPId(connector.charge_point_id).toLowerCase().includes(searchTerm)
    )
  }

  // Process with Kendo data query
  const result = process(data, {
    take: take.value,
    skip: skip.value,
    group: group.value,
    sort: sort.value,
    filter: filter.value
  })

  return result
})

// Methods
const onDataStateChange = (event: any) => {
  if (!event?.data) return

  take.value = event.data.take || 10
  skip.value = event.data.skip || 0
  group.value = event.data.group || []
  sort.value = event.data.sort || []
  filter.value = event.data.filter || { logic: 'and' as const, filters: [] }
}

const onSelectionChange = (event: any) => {
  // Handle selection changes from Kendo Grid
}

const toggleSelection = (item: Connector) => {
  const index = selectedItems.value.findIndex((selected) => selected.id === item.id)

  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = [...connectors.value]
  }
}

const onGlobalSearchChange = () => {
  // Trigger grid refresh
  skip.value = 0
}

const viewItem = (item: Connector) => {
  viewingItem.value = item
  showViewDialog.value = true
}

const editItem = (item: Connector) => {
  editingItem.value = { ...item }
  showCreateDialog.value = true
}

const deleteItem = async (item: Connector) => {
  if (item.id && confirm(`Delete connector ${item.connector_number}?`)) {
    await connectorsStore.deleteConnector(item.id)
  }
}

const deleteSelected = async () => {
  if (selectedItems.value.length === 0) return

  if (confirm(`Delete ${selectedItems.value.length} selected items?`)) {
    for (const item of selectedItems.value) {
      if (item.id) {
        await connectorsStore.deleteConnector(item.id)
      }
    }
    selectedItems.value = []
  }
}

const exportSelected = (format: 'xlsx' | 'pdf') => {
  const dataToExport = selectedItems.value.length > 0 ? selectedItems.value : connectors.value

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((connector) => ({
        ID: connector.id,
        'Charge Point': getChargePointOCPPId(connector.charge_point_id),
        'Connector #': connector.connector_number,
        Type: connector.type,
        'Max Power (kW)': connector.max_power_kw,
        Status: connector.status,
        Created: formatDate(connector.created_at)
      }))
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Connectors')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `connectors-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  } else if (format === 'pdf') {
    const doc = new jsPDF()

    const tableData = dataToExport.map((connector) => [
      connector.id?.toString() || '',
      getChargePointOCPPId(connector.charge_point_id),
      connector.connector_number?.toString() || '',
      connector.type || '',
      connector.max_power_kw?.toString() || '',
      connector.status || '',
      formatDate(connector.created_at)
    ])

    autoTable(doc, {
      head: [['ID', 'Charge Point', 'Connector #', 'Type', 'Max Power', 'Status', 'Created']],
      body: tableData,
      margin: { top: 20 },
      styles: { fontSize: 8 }
    })

    doc.save(`connectors-export-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

const onSaveConnector = async (connectorData: any) => {
  let success = false

  if (editingItem.value && editingItem.value.id) {
    // Update existing connector
    success = await connectorsStore.updateConnector({ ...connectorData, id: editingItem.value.id })
  } else {
    // Create new connector
    success = await connectorsStore.createConnector(connectorData)
  }

  if (success) {
    onCancelDialog()
  }
}

const onCancelDialog = () => {
  showCreateDialog.value = false
  editingItem.value = null
}

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    errorSnackbar.value = true
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([connectorsStore.fetchConnectors(), chargePointsStore.fetchChargePoints()])
})
</script>

<style scoped>
.connectors-view {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
}

.grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.grid-container {
  margin-top: 20px;
  position: relative;
  z-index: 1;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.status-chip {
  font-weight: 500;
  text-transform: uppercase;
}

/* Kendo Grid Styling */
:deep(.k-grid) {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: inherit;
}

:deep(.k-grid-header) {
  background: #f5f5f5;
}

:deep(.k-grid-header .k-header) {
  border-color: #e0e0e0;
  font-weight: 600;
}

:deep(.k-alt) {
  background: #fafafa;
}

/* Remove selected row background */
:deep(.k-state-selected) {
  background: inherit !important;
  color: inherit !important;
}

:deep(.k-pager) {
  border-top: 1px solid #e0e0e0;
}

:deep(.k-grid-content) {
  overflow-x: auto;
}

/* Hide row selection background */
:deep(.k-master-row.k-state-selected) {
  background: inherit !important;
}

:deep(.k-grouping-row.k-state-selected) {
  background: inherit !important;
}

/* Fix z-index issues */
::deep(.k-grid) {
  position: relative;
  z-index: 2;
}

/* Additional rules to completely remove selection backgrounds */
::deep(.k-state-selected:hover),
::deep(.k-state-selected.k-alt),
::deep(.k-state-selected.k-alt:hover),
::deep(.k-grid-content .k-state-selected),
::deep(.k-grid-content .k-state-selected:hover),
::deep(.k-grid-content .k-state-selected.k-alt),
::deep(.k-grid-content .k-state-selected.k-alt:hover) {
  background-color: transparent !important;
  background: transparent !important;
}
</style>
