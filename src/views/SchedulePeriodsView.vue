<template>
  <div class="schedule-periods-view">
    <v-container fluid>
      <v-row>
        <v-col>
          <h1 class="page-title">{{ $t('schedulePeriods.title') }}</h1>

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
                {{ $t('schedulePeriods.create') }}
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

              <!-- Duration Cell Template -->
              <template #durationTemplate="{ props }">
                <span v-if="props.dataItem" class="duration-display">
                  {{ formatDuration(props.dataItem.start_period_in_seconds) }}
                </span>
              </template>

              <!-- Limit Cell Template -->
              <template #limitTemplate="{ props }">
                <v-chip
                  v-if="props.dataItem"
                  :color="getLimitColor(props.dataItem.limit)"
                  size="small"
                  class="limit-chip"
                >
                  {{ props.dataItem.limit }} kW
                </v-chip>
              </template>

              <!-- Phases Cell Template -->
              <template #phasesTemplate="{ props }">
                <div v-if="props.dataItem" class="phases-display">
                  <v-icon
                    v-for="phase in props.dataItem.number_phases"
                    :key="phase"
                    size="small"
                    color="primary"
                  >
                    mdi-electric-switch
                  </v-icon>
                  <span class="phases-text">{{ props.dataItem.number_phases }}</span>
                </div>
              </template>

              <!-- Actions Cell Template -->
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
          {{ editingItem ? $t('schedulePeriods.edit') : $t('schedulePeriods.create') }}
        </v-card-title>
        <v-card-text>
          <SchedulePeriodForm
            :schedule-period="editingItem"
            @save="onSaveSchedulePeriod"
            @cancel="onCancelDialog"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="showViewDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ $t('schedulePeriods.view') }}</v-card-title>
        <v-card-text>
          <div v-if="viewingItem">
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('schedulePeriods.startPeriod') }}:</strong>
                {{ formatDuration(viewingItem.start_period_in_seconds) }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('schedulePeriods.limit') }}:</strong>
                <v-chip :color="getLimitColor(viewingItem.limit)" size="small">
                  {{ viewingItem.limit }} kW
                </v-chip>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('schedulePeriods.phases') }}:</strong> {{ viewingItem.number_phases }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('schedulePeriods.chargingProfile') }}:</strong>
                {{ getChargingProfileDescription(viewingItem.charging_profile_id) }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <strong>{{ $t('schedulePeriods.chargePoint') }}:</strong>
                {{ getChargePointOCPPId(viewingItem.charging_profile_id) }}
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
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useChargePointsStore } from '@/stores/chargepoints'
import SchedulePeriodForm from '@/components/SchedulePeriodForm.vue'
import type { SchedulePeriod } from '@/types/scheduleperiods'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Stores
const schedulePeriodsStore = useSchedulePeriodsStore()
const chargingProfilesStore = useChargingProfilesStore()
const chargePointsStore = useChargePointsStore()

// Reactive data
const gridRef = ref()
const globalSearch = ref('')
const selectedItems = ref<SchedulePeriod[]>([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingItem = ref<SchedulePeriod | null>(null)
const viewingItem = ref<SchedulePeriod | null>(null)
const errorSnackbar = ref(false)

// Grid state
const take = ref(10)
const skip = ref(0)
const group = ref([])
const sort = ref([])
const filter = ref({ logic: 'and' as const, filters: [] })

// Computed properties
const loading = computed(
  () => schedulePeriodsStore.loading || chargingProfilesStore.loading || chargePointsStore.loading
)
const error = computed(
  () => schedulePeriodsStore.error || chargingProfilesStore.error || chargePointsStore.error
)
const schedulePeriods = computed(() => schedulePeriodsStore.allSchedulePeriods)
const total = computed(() => schedulePeriods.value.length)
const isAllSelected = computed(
  () =>
    schedulePeriods.value.length > 0 && selectedItems.value.length === schedulePeriods.value.length
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

// Helper functions
const getChargingProfileDescription = (profileId: number): string => {
  const profile = chargingProfilesStore.getChargingProfileById(profileId)
  return profile?.description || `Profile ${profileId}`
}

const getChargePointOCPPId = (profileId: number): string => {
  const profile = chargingProfilesStore.getChargingProfileById(profileId)
  if (profile) {
    const chargePoint = chargePointsStore.getChargePointById(profile.charge_point_id)
    return chargePoint?.ocpp_charge_box_id || `CP-${profile.charge_point_id}`
  }
  return 'Unknown'
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

const getLimitColor = (limit: number): string => {
  if (limit >= 50) return 'error'
  if (limit >= 20) return 'warning'
  if (limit >= 10) return 'success'
  return 'info'
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
    field: 'charging_profile_id',
    title: 'Charging Profile',
    columnMenu: true,
  },
  {
    field: 'charge_point',
    title: 'Charge Point',
    filterable: false,
    sortable: false,
  },
  {
    field: 'start_period_in_seconds',
    title: 'Start Period',
    width: '140px',
    columnMenu: true,
    cell: 'durationTemplate'
  },
  {
    field: 'limit',
    title: 'Power Limit',
    width: '130px',
    columnMenu: true,
    cell: 'limitTemplate'
  },
  {
    field: 'number_phases',
    title: 'Phases',
    width: '120px',
    columnMenu: true,
    cell: 'phasesTemplate'
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
  let data = schedulePeriods.value
    .filter((period) => period && typeof period === 'object')
    .map((period) => ({
      ...period,
      selected: selectedItems.value.some((item) => item.id === period.id),
      // Ensure all required fields exist
      created_at: period.created_at || '',
      updated_at: period.updated_at || ''
    }))

  // Apply global search
  if (globalSearch.value) {
    const searchTerm = globalSearch.value.toLowerCase()
    data = data.filter(
      (period) =>
        period.limit.toString().includes(searchTerm) ||
        period.start_period_in_seconds.toString().includes(searchTerm) ||
        period.number_phases.toString().includes(searchTerm) ||
        getChargingProfileDescription(period.charging_profile_id)
          .toLowerCase()
          .includes(searchTerm) ||
        getChargePointOCPPId(period.charging_profile_id).toLowerCase().includes(searchTerm)
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

const toggleSelection = (item: SchedulePeriod) => {
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
    selectedItems.value = [...schedulePeriods.value]
  }
}

const onGlobalSearchChange = () => {
  // Trigger grid refresh
  skip.value = 0
}

const viewItem = (item: SchedulePeriod) => {
  viewingItem.value = item
  showViewDialog.value = true
}

const editItem = (item: SchedulePeriod) => {
  editingItem.value = { ...item }
  showCreateDialog.value = true
}

const deleteItem = async (item: SchedulePeriod) => {
  if (item.id && confirm(`Delete schedule period ${item.id}?`)) {
    await schedulePeriodsStore.deleteSchedulePeriod(item.id)
  }
}

const deleteSelected = async () => {
  if (selectedItems.value.length === 0) return

  if (confirm(`Delete ${selectedItems.value.length} selected items?`)) {
    for (const item of selectedItems.value) {
      if (item.id) {
        await schedulePeriodsStore.deleteSchedulePeriod(item.id)
      }
    }
    selectedItems.value = []
  }
}

const exportSelected = (format: 'xlsx' | 'pdf') => {
  const dataToExport = selectedItems.value.length > 0 ? selectedItems.value : schedulePeriods.value

  if (format === 'xlsx') {
    // Enhance export data with related information
    const enhancedData = dataToExport.map((period) => ({
      ID: period.id,
      'Charging Profile': getChargingProfileDescription(period.charging_profile_id),
      'Charge Point': getChargePointOCPPId(period.charging_profile_id),
      'Start Period': formatDuration(period.start_period_in_seconds),
      'Limit (kW)': period.limit,
      Phases: period.number_phases,
      Created: formatDate(period.created_at)
    }))

    const worksheet = XLSX.utils.json_to_sheet(enhancedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SchedulePeriods')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `schedule-periods-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  } else if (format === 'pdf') {
    const doc = new jsPDF()

    const tableData = dataToExport.map((period) => [
      period.id?.toString() || '',
      getChargingProfileDescription(period.charging_profile_id),
      formatDuration(period.start_period_in_seconds),
      period.limit?.toString() || '',
      period.number_phases?.toString() || '',
      formatDate(period.created_at)
    ])

    autoTable(doc, {
      head: [['ID', 'Profile', 'Start Period', 'Limit (kW)', 'Phases', 'Created']],
      body: tableData,
      margin: { top: 20 },
      styles: { fontSize: 8 }
    })

    doc.save(`schedule-periods-export-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

const onSaveSchedulePeriod = async (periodData: any) => {
  let success = false

  if (editingItem.value && editingItem.value.id) {
    // Update existing schedule period
    success = await schedulePeriodsStore.updateSchedulePeriod({
      ...periodData,
      id: editingItem.value.id
    })
  } else {
    // Create new schedule period
    success = await schedulePeriodsStore.createSchedulePeriod(periodData)
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
    schedulePeriodsStore.fetchSchedulePeriods(),
    chargingProfilesStore.fetchChargingProfiles(),
    chargePointsStore.fetchChargePoints()
  ])
})
</script>

<style scoped>
.schedule-periods-view {
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

.duration-display {
  font-family: monospace;
  font-weight: 500;
  color: #1976d2;
}

.limit-chip {
  font-weight: 600;
}

.phases-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.phases-text {
  font-weight: 500;
  margin-left: 4px;
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
