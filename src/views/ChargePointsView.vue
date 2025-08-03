<template>
  <div class="charge-points-view">
    <v-container fluid>
      <v-row>
        <v-col>
          <h1 class="page-title">{{ $t('chargePoints.title') }}</h1>

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
                {{ $t('chargePoints.create') }}
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
              :detail="detailTemplate"
              :expand-field="'expanded'"
              :take="take"
              :skip="skip"
              :total="total"
              :group="group"
              :sort="sort"
              :filter="filter"
              :loader="loading"
              @datastatechange="onDataStateChange"
              @expandchange="onExpandChange"
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

              <!-- Master-Detail Template -->
              <template #detailTemplate="{ props }">
                <div v-if="props.dataItem" class="detail-container">
                  <v-tabs v-model="activeTab" class="detail-tabs">
                    <v-tab value="connectors">
                      <v-icon left>mdi-power-plug</v-icon>
                      {{ $t('connectors.title') }}
                    </v-tab>
                    <v-tab value="profiles">
                      <v-icon left>mdi-chart-line</v-icon>
                      {{ $t('chargingProfiles.title') }}
                    </v-tab>
                  </v-tabs>

                  <v-tabs-window v-model="activeTab">
                    <v-tabs-window-item value="connectors">
                      <div class="tab-content">
                        <h4>
                          {{ $t('connectors.title') }} for
                          {{ props.dataItem?.ocpp_charge_box_id || 'Unknown' }}
                        </h4>
                        <Grid
                          :data-items="
                            props.dataItem?.id ? getConnectorsForChargePoint(props.dataItem.id) : []
                          "
                          :columns="connectorColumns"
                          :sortable="true"
                          :pageable="{ pageSize: 5 }"
                          style="margin-top: 16px"
                        />
                      </div>
                    </v-tabs-window-item>

                    <v-tabs-window-item value="profiles">
                      <div class="tab-content">
                        <h4>
                          {{ $t('chargingProfiles.title') }} for
                          {{ props.dataItem?.ocpp_charge_box_id || 'Unknown' }}
                        </h4>
                        <Grid
                          :data-items="
                            props.dataItem?.id
                              ? getChargingProfilesForChargePoint(props.dataItem.id)
                              : []
                          "
                          :columns="chargingProfileColumns"
                          :sortable="true"
                          :pageable="{ pageSize: 5 }"
                          style="margin-top: 16px"
                        />
                      </div>
                    </v-tabs-window-item>
                  </v-tabs-window>
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
          {{ editingItem ? $t('chargePoints.edit') : $t('chargePoints.create') }}
        </v-card-title>
        <v-card-text>
          <ChargePointForm
            :charge-point="editingItem"
            @save="onSaveChargePoint"
            @cancel="onCancelDialog"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="showViewDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ $t('chargePoints.view') }}</v-card-title>
        <v-card-text>
          <div v-if="viewingItem">
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('chargePoints.ocppId') }}:</strong>
                {{ viewingItem.ocpp_charge_box_id }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('chargePoints.status') }}:</strong>
                <v-chip :color="getStatusColor(viewingItem.status)" size="small">
                  {{ viewingItem.status }}
                </v-chip>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('chargePoints.manufacturer') }}:</strong>
                {{ viewingItem.manufacturer }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('chargePoints.model') }}:</strong> {{ viewingItem.model }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('chargePoints.connectorCount') }}:</strong>
                {{ viewingItem.connector_count }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('chargePoints.site') }}:</strong>
                {{ getSiteName(viewingItem.site_id) }}
              </v-col>
            </v-row>
            <v-row v-if="viewingItem.note">
              <v-col cols="12">
                <strong>{{ $t('chargePoints.note') }}:</strong> {{ viewingItem.note }}
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
import { useChargePointsStore } from '@/stores/chargepoints'
import { useConnectorsStore } from '@/stores/connectors'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useSitesStore } from '@/stores/sites'
import ChargePointForm from '@/components/ChargePointForm.vue'
import type { ChargePoint } from '@/types/chargepoints'
import type { Connector } from '@/types/connectors'
import type { ChargingProfile } from '@/types/chargingprofiles'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Stores
const chargePointsStore = useChargePointsStore()
const connectorsStore = useConnectorsStore()
const chargingProfilesStore = useChargingProfilesStore()
const sitesStore = useSitesStore()

// Reactive data
const gridRef = ref()
const globalSearch = ref('')
const selectedItems = ref<ChargePoint[]>([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingItem = ref<ChargePoint | null>(null)
const viewingItem = ref<ChargePoint | null>(null)
const errorSnackbar = ref(false)
const activeTab = ref('connectors')

// Grid state
const take = ref(10)
const skip = ref(0)
const group = ref([])
const sort = ref([])
const filter = ref({ logic: 'and' as const, filters: [] })

// Computed properties
const loading = computed(
  () =>
    chargePointsStore.loading ||
    connectorsStore.loading ||
    chargingProfilesStore.loading ||
    sitesStore.loading
)
const error = computed(
  () =>
    chargePointsStore.error ||
    connectorsStore.error ||
    chargingProfilesStore.error ||
    sitesStore.error
)
const chargePoints = computed(() => chargePointsStore.allChargePoints)
const total = computed(() => chargePoints.value.length)
const isAllSelected = computed(
  () => chargePoints.value.length > 0 && selectedItems.value.length === chargePoints.value.length
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

// Helper function to get site name
const getSiteName = (siteId: number): string => {
  const site = sitesStore.getSiteById(siteId)
  return site?.name || `Site ${siteId}`
}

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'faulty':
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
    field: 'ocpp_charge_box_id',
    title: 'OCPP ID',
    columnMenu: true
  },
  {
    field: 'site_id',
    title: 'Site',
    columnMenu: true,
  },
  {
    field: 'manufacturer',
    title: 'Manufacturer',
    columnMenu: true
  },
  {
    field: 'model',
    title: 'Model',
    columnMenu: true
  },
  {
    field: 'connector_count',
    title: 'Connectors',
    width: '120px',
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

// Connector columns for master-detail
const connectorColumns = ref([
  {
    field: 'id',
    title: 'ID',
    width: '80px'
  },
  {
    field: 'connector_number',
    title: 'Number',
    width: '100px'
  },
  {
    field: 'type',
    title: 'Type'
  },
  {
    field: 'max_power_kw',
    title: 'Max Power (kW)',
    width: '140px'
  },
  {
    field: 'status',
    title: 'Status',
    width: '120px'
  }
])

// Charging profile columns for master-detail
const chargingProfileColumns = ref([
  {
    field: 'id',
    title: 'ID',
    width: '80px'
  },
  {
    field: 'stack_level',
    title: 'Stack Level',
    width: '120px'
  },
  {
    field: 'charging_profile_purpose',
    title: 'Purpose'
  },
  {
    field: 'charging_profile_kind',
    title: 'Kind'
  },
  {
    field: 'valid_from',
    title: 'Valid From',
    format: '{0:dd/MM/yyyy}'
  },
  {
    field: 'valid_to',
    title: 'Valid To',
    format: '{0:dd/MM/yyyy}'
  }
])

// Process data for grid
const processedData = computed(() => {
  let data = chargePoints.value
    .filter((chargePoint) => chargePoint && typeof chargePoint === 'object')
    .map((chargePoint) => ({
      ...chargePoint,
      selected: selectedItems.value.some((item) => item.id === chargePoint.id),
      // Ensure all required fields exist
      created_at: chargePoint.created_at || '',
      updated_at: chargePoint.updated_at || '',
      note: chargePoint.note || ''
    }))

  // Apply global search
  if (globalSearch.value) {
    const searchTerm = globalSearch.value.toLowerCase()
    data = data.filter(
      (chargePoint) =>
        chargePoint.ocpp_charge_box_id?.toLowerCase().includes(searchTerm) ||
        chargePoint.manufacturer?.toLowerCase().includes(searchTerm) ||
        chargePoint.model?.toLowerCase().includes(searchTerm) ||
        chargePoint.status?.toLowerCase().includes(searchTerm) ||
        getSiteName(chargePoint.site_id).toLowerCase().includes(searchTerm)
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

const onExpandChange = (event: any) => {
  const item = event.dataItem
  if (item) {
    item.expanded = event.value
  }
}

// Detail template function
const detailTemplate = (props: any) => {
  return 'detailTemplate'
}

const onSelectionChange = (event: any) => {
  // Handle selection changes from Kendo Grid
}

const toggleSelection = (item: ChargePoint) => {
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
    selectedItems.value = [...chargePoints.value]
  }
}

const onGlobalSearchChange = () => {
  // Trigger grid refresh
  skip.value = 0
}

const getConnectorsForChargePoint = (chargePointId: number): Connector[] => {
  return connectorsStore.getConnectorsByChargePointId(chargePointId)
}

const getChargingProfilesForChargePoint = (chargePointId: number): ChargingProfile[] => {
  return chargingProfilesStore.getChargingProfilesByChargePointId(chargePointId)
}

const viewItem = (item: ChargePoint) => {
  viewingItem.value = item
  showViewDialog.value = true
}

const editItem = (item: ChargePoint) => {
  editingItem.value = { ...item }
  showCreateDialog.value = true
}

const deleteItem = async (item: ChargePoint) => {
  if (item.id && confirm(`Delete charge point "${item.ocpp_charge_box_id}"?`)) {
    await chargePointsStore.deleteChargePoint(item.id)
  }
}

const deleteSelected = async () => {
  if (selectedItems.value.length === 0) return

  if (confirm(`Delete ${selectedItems.value.length} selected items?`)) {
    for (const item of selectedItems.value) {
      if (item.id) {
        await chargePointsStore.deleteChargePoint(item.id)
      }
    }
    selectedItems.value = []
  }
}

const exportSelected = (format: 'xlsx' | 'pdf') => {
  const dataToExport = selectedItems.value.length > 0 ? selectedItems.value : chargePoints.value

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((cp) => ({
        ID: cp.id,
        'OCPP ID': cp.ocpp_charge_box_id,
        Site: getSiteName(cp.site_id),
        Manufacturer: cp.manufacturer,
        Model: cp.model,
        'Connector Count': cp.connector_count,
        Status: cp.status,
        Note: cp.note || '',
        Created: formatDate(cp.created_at)
      }))
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ChargePoints')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `chargepoints-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  } else if (format === 'pdf') {
    const doc = new jsPDF()

    const tableData = dataToExport.map((cp) => [
      cp.id?.toString() || '',
      cp.ocpp_charge_box_id || '',
      getSiteName(cp.site_id),
      cp.manufacturer || '',
      cp.model || '',
      cp.status || '',
      formatDate(cp.created_at)
    ])

    autoTable(doc, {
      head: [['ID', 'OCPP ID', 'Site', 'Manufacturer', 'Model', 'Status', 'Created']],
      body: tableData,
      margin: { top: 20 },
      styles: { fontSize: 8 }
    })

    doc.save(`chargepoints-export-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

const onSaveChargePoint = async (chargePointData: any) => {
  let success = false

  if (editingItem.value && editingItem.value.id) {
    // Update existing charge point
    success = await chargePointsStore.updateChargePoint({
      ...chargePointData,
      id: editingItem.value.id
    })
  } else {
    // Create new charge point
    success = await chargePointsStore.createChargePoint(chargePointData)
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
  await Promise.all([
    chargePointsStore.fetchChargePoints(),
    connectorsStore.fetchConnectors(),
    chargingProfilesStore.fetchChargingProfiles(),
    sitesStore.fetchSites()
  ])
})
</script>

<style scoped>
.charge-points-view {
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

.detail-container {
  padding: 20px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.detail-tabs {
  margin-bottom: 16px;
}

.tab-content {
  padding: 16px 0;
}

.tab-content h4 {
  margin-bottom: 16px;
  color: #1976d2;
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
