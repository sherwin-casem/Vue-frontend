<template>
  <div class="charging-profiles-view">
    <v-container fluid>
      <v-row>
        <v-col>
          <h1 class="page-title">{{ $t('chargingProfiles.title') }}</h1>

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
                {{ $t('chargingProfiles.create') }}
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

              <!-- Purpose Cell Template -->
              <template #purposeTemplate="{ props }">
                <v-chip
                  v-if="props.dataItem"
                  :color="getPurposeColor(props.dataItem.charging_profile_purpose)"
                  size="small"
                  class="purpose-chip"
                >
                  {{ props.dataItem.charging_profile_purpose }}
                </v-chip>
              </template>

              <!-- Kind Cell Template -->
              <template #kindTemplate="{ props }">
                <v-chip
                  v-if="props.dataItem"
                  :color="getKindColor(props.dataItem.charging_profile_kind)"
                  size="small"
                  class="kind-chip"
                  variant="outlined"
                >
                  {{ props.dataItem.charging_profile_kind }}
                </v-chip>
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

              <!-- Master-Detail Template -->
              <template #detailTemplate="{ props }">
                <div class="detail-container">
                  <h3>{{ $t('schedulePeriods.title') }} for Profile {{ props.dataItem.id }}</h3>
                  <Grid
                    :data-items="getSchedulePeriodsForProfile(props.dataItem.id)"
                    :columns="schedulePeriodsColumns"
                    :sortable="true"
                    :pageable="{ pageSize: 5 }"
                    style="margin: 20px 0"
                  />

                  <div class="profile-details">
                    <v-row>
                      <v-col cols="6">
                        <v-card variant="outlined" class="profile-detail-card">
                          <v-card-title>Profile Details</v-card-title>
                          <v-card-text>
                            <div class="detail-item">
                              <strong>Description:</strong>
                              {{ props.dataItem.description || 'N/A' }}
                            </div>
                            <div class="detail-item">
                              <strong>Note:</strong> {{ props.dataItem.note || 'N/A' }}
                            </div>
                            <div class="detail-item">
                              <strong>Duration:</strong>
                              {{ formatDuration(props.dataItem.duration_in_seconds) }}
                            </div>
                            <div class="detail-item">
                              <strong>Min Charging Rate:</strong>
                              {{ props.dataItem.min_charging_rate || 'N/A' }} kW
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col cols="6">
                        <v-card variant="outlined" class="profile-detail-card">
                          <v-card-title>Schedule Details</v-card-title>
                          <v-card-text>
                            <div class="detail-item">
                              <strong>Recurrency:</strong>
                              {{ props.dataItem.recurrency_kind || 'None' }}
                            </div>
                            <div class="detail-item">
                              <strong>Start Schedule:</strong>
                              {{ formatDateTime(props.dataItem.start_schedule) }}
                            </div>
                            <div class="detail-item">
                              <strong>Valid From:</strong>
                              {{ formatDateTime(props.dataItem.valid_from) }}
                            </div>
                            <div class="detail-item">
                              <strong>Valid To:</strong>
                              {{ formatDateTime(props.dataItem.valid_to) }}
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </div>
              </template>
            </Grid>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editingItem ? $t('chargingProfiles.edit') : $t('chargingProfiles.create') }}
        </v-card-title>
        <v-card-text>
          <ChargingProfileForm
            :charging-profile="editingItem"
            @save="onSaveChargingProfile"
            @cancel="onCancelDialog"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="showViewDialog" max-width="700px">
      <v-card>
        <v-card-title>{{ $t('chargingProfiles.view') }}</v-card-title>
        <v-card-text>
          <div v-if="viewingItem">
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('chargingProfiles.stackLevel') }}:</strong>
                {{ viewingItem.stack_level }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('chargingProfiles.purpose') }}:</strong>
                <v-chip :color="getPurposeColor(viewingItem.charging_profile_purpose)" size="small">
                  {{ viewingItem.charging_profile_purpose }}
                </v-chip>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('chargingProfiles.kind') }}:</strong>
                <v-chip
                  :color="getKindColor(viewingItem.charging_profile_kind)"
                  size="small"
                  variant="outlined"
                >
                  {{ viewingItem.charging_profile_kind }}
                </v-chip>
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('chargingProfiles.chargePoint') }}:</strong>
                {{ getChargePointOCPPId(viewingItem.charge_point_id) }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('chargingProfiles.validFrom') }}:</strong>
                {{ formatDateTime(viewingItem.valid_from) }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('chargingProfiles.validTo') }}:</strong>
                {{ formatDateTime(viewingItem.valid_to) }}
              </v-col>
            </v-row>
            <v-row v-if="viewingItem.description">
              <v-col cols="12">
                <strong>{{ $t('chargingProfiles.description') }}:</strong>
                {{ viewingItem.description }}
              </v-col>
            </v-row>
            <v-row v-if="viewingItem.note">
              <v-col cols="12">
                <strong>{{ $t('chargingProfiles.note') }}:</strong> {{ viewingItem.note }}
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
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import { useChargePointsStore } from '@/stores/chargepoints'
import ChargingProfileForm from '@/components/ChargingProfileForm.vue'
import type { ChargingProfile } from '@/types/chargingprofiles'
import type { SchedulePeriod } from '@/types/scheduleperiods'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Stores
const chargingProfilesStore = useChargingProfilesStore()
const schedulePeriodsStore = useSchedulePeriodsStore()
const chargePointsStore = useChargePointsStore()

// Reactive data
const gridRef = ref()
const globalSearch = ref('')
const selectedItems = ref<ChargingProfile[]>([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingItem = ref<ChargingProfile | null>(null)
const viewingItem = ref<ChargingProfile | null>(null)
const errorSnackbar = ref(false)

// Grid state
const take = ref(10)
const skip = ref(0)
const group = ref([])
const sort = ref([])
const filter = ref({ logic: 'and' as const, filters: [] })

// Computed properties
const loading = computed(
  () => chargingProfilesStore.loading || schedulePeriodsStore.loading || chargePointsStore.loading
)
const error = computed(
  () => chargingProfilesStore.error || schedulePeriodsStore.error || chargePointsStore.error
)
const chargingProfiles = computed(() => chargingProfilesStore.allChargingProfiles)
const total = computed(() => chargingProfiles.value.length)
const isAllSelected = computed(
  () =>
    chargingProfiles.value.length > 0 &&
    selectedItems.value.length === chargingProfiles.value.length
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
const getChargePointOCPPId = (chargePointId: number): string => {
  const chargePoint = chargePointsStore.getChargePointById(chargePointId)
  return chargePoint?.ocpp_charge_box_id || `CP-${chargePointId}`
}

const getPurposeColor = (purpose: string): string => {
  switch (purpose) {
    case 'TxDefault':
      return 'primary'
    case 'TxProfile':
      return 'success'
    case 'TxMaxProfile':
      return 'warning'
    default:
      return 'default'
  }
}

const getKindColor = (kind: string): string => {
  switch (kind) {
    case 'Absolute':
      return 'info'
    case 'Recurring':
      return 'secondary'
    case 'Relative':
      return 'accent'
    default:
      return 'default'
  }
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const formatDateTime = (datetime?: string): string => {
  if (!datetime) return 'N/A'
  return new Date(datetime).toLocaleString()
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
    field: 'stack_level',
    title: 'Stack Level',
    width: '120px',
    columnMenu: true
  },
  {
    field: 'charging_profile_purpose',
    title: 'Purpose',
    columnMenu: true,
    cell: 'purposeTemplate'
  },
  {
    field: 'charging_profile_kind',
    title: 'Kind',
    columnMenu: true,
    cell: 'kindTemplate'
  },
  {
    field: 'valid_from',
    title: 'Valid From',
    columnMenu: true,
    format: '{0:dd/MM/yyyy}',
  },
  {
    field: 'valid_to',
    title: 'Valid To',
    columnMenu: true,
    format: '{0:dd/MM/yyyy}',
  },
  {
    field: 'description',
    title: 'Description',
    columnMenu: true
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

const schedulePeriodsColumns = ref([
  {
    field: 'id',
    title: 'ID',
    width: '80px'
  },
  {
    field: 'start_period_in_seconds',
    title: 'Start (seconds)',
    width: '140px'
  },
  {
    field: 'limit',
    title: 'Limit (kW)',
    width: '120px'
  },
  {
    field: 'number_phases',
    title: 'Phases',
    width: '100px'
  },
  {
    field: 'created_at',
    title: 'Created',
    format: '{0:dd/MM/yyyy}'
  }
])

// Process data for grid
const processedData = computed(() => {
  let data = chargingProfiles.value
    .filter((profile) => profile && typeof profile === 'object')
    .map((profile) => ({
      ...profile,
      selected: selectedItems.value.some((item) => item.id === profile.id),
      created_at: profile.created_at || '',
      valid_from: profile.valid_from || '',
      valid_to: profile.valid_to || '',
      description: profile.description || '',
      note: profile.note || ''
    }))

  // Apply global search
  if (globalSearch.value) {
    const searchTerm = globalSearch.value.toLowerCase()
    data = data.filter(
      (profile) =>
        profile.description?.toLowerCase().includes(searchTerm) ||
        profile.note?.toLowerCase().includes(searchTerm) ||
        profile.charging_profile_purpose?.toLowerCase().includes(searchTerm) ||
        profile.charging_profile_kind?.toLowerCase().includes(searchTerm) ||
        getChargePointOCPPId(profile.charge_point_id).toLowerCase().includes(searchTerm)
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

const toggleSelection = (item: ChargingProfile) => {
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
    selectedItems.value = [...chargingProfiles.value]
  }
}

const onGlobalSearchChange = () => {
  // Trigger grid refresh
  skip.value = 0
}

const getSchedulePeriodsForProfile = (profileId: number): SchedulePeriod[] => {
  return schedulePeriodsStore.getSchedulePeriodsByProfileId(profileId)
}

const viewItem = (item: ChargingProfile) => {
  viewingItem.value = item
  showViewDialog.value = true
}

const editItem = (item: ChargingProfile) => {
  editingItem.value = { ...item }
  showCreateDialog.value = true
}

const deleteItem = async (item: ChargingProfile) => {
  if (item.id && confirm(`Delete charging profile ${item.id}?`)) {
    await chargingProfilesStore.deleteChargingProfile(item.id)
  }
}

const deleteSelected = async () => {
  if (selectedItems.value.length === 0) return

  if (confirm(`Delete ${selectedItems.value.length} selected items?`)) {
    for (const item of selectedItems.value) {
      if (item.id) {
        await chargingProfilesStore.deleteChargingProfile(item.id)
      }
    }
    selectedItems.value = []
  }
}

const exportSelected = (format: 'xlsx' | 'pdf') => {
  const dataToExport = selectedItems.value.length > 0 ? selectedItems.value : chargingProfiles.value

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((profile) => ({
        ID: profile.id,
        'Charge Point': getChargePointOCPPId(profile.charge_point_id),
        'Stack Level': profile.stack_level,
        Purpose: profile.charging_profile_purpose,
        Kind: profile.charging_profile_kind,
        'Valid From': formatDate(profile.valid_from),
        'Valid To': formatDate(profile.valid_to),
        Description: profile.description || '',
        Note: profile.note || '',
        Created: formatDate(profile.created_at)
      }))
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ChargingProfiles')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `charging-profiles-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  } else if (format === 'pdf') {
    const doc = new jsPDF()

    const tableData = dataToExport.map((profile) => [
      profile.id?.toString() || '',
      getChargePointOCPPId(profile.charge_point_id),
      profile.stack_level?.toString() || '',
      profile.charging_profile_purpose || '',
      profile.charging_profile_kind || '',
      formatDate(profile.valid_from),
      formatDate(profile.created_at)
    ])

    autoTable(doc, {
      head: [['ID', 'Charge Point', 'Stack Level', 'Purpose', 'Kind', 'Valid From', 'Created']],
      body: tableData,
      margin: { top: 20 },
      styles: { fontSize: 7 }
    })

    doc.save(`charging-profiles-export-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

const onSaveChargingProfile = async (profileData: any) => {
  let success = false

  if (editingItem.value && editingItem.value.id) {
    // Update existing charging profile
    success = await chargingProfilesStore.updateChargingProfile({
      ...profileData,
      id: editingItem.value.id
    })
  } else {
    // Create new charging profile
    success = await chargingProfilesStore.createChargingProfile(profileData)
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
    chargingProfilesStore.fetchChargingProfiles(),
    schedulePeriodsStore.fetchSchedulePeriods(),
    chargePointsStore.fetchChargePoints()
  ])
})
</script>

<style scoped>
.charging-profiles-view {
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

.detail-container h3 {
  margin-bottom: 16px;
  color: #1976d2;
}

.profile-details {
  margin-top: 20px;
}

.profile-detail-card {
  height: 100%;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.purpose-chip,
.kind-chip {
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
