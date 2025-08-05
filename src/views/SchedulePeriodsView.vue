<template>
  <div class="scheduleperiods-management">
    <v-card elevation="2">
      <v-card-title class="scheduleperiods-header">
        <h1 class="text-h4">{{ $t('scheduleperiods.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('scheduleperiods.manageAllSchedulePeriods') }}
        </p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            :disabled="schedulePeriodsStore.loading"
          >
            {{ $t('scheduleperiods.addSchedulePeriod') }}
          </v-btn>

          <v-spacer></v-spacer>

          <div class="search-container">
            <v-text-field
              v-model="globalSearch"
              prepend-icon="mdi-magnify"
              :label="$t('common.search')"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="search-field"
            ></v-text-field>
          </div>

          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-export"
                v-bind="props"
                :disabled="!schedulePeriods.length || schedulePeriodsStore.loading"
                class="export-btn"
              >
                {{ $t('export.export') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="exportToPdf">
                <v-list-item-title>
                  <v-icon start>mdi-file-pdf-box</v-icon>
                  {{ $t('export.exportToPdf') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToExcel">
                <v-list-item-title>
                  <v-icon start>mdi-file-excel</v-icon>
                  {{ $t('export.exportToExcel') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToCsv">
                <v-list-item-title>
                  <v-icon start>mdi-file-delimited</v-icon>
                  {{ $t('export.exportToCsv') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            variant="text"
            icon="mdi-refresh"
            @click="refreshData"
            :loading="schedulePeriodsStore.loading"
          ></v-btn>
        </div>

        <v-alert
          v-if="schedulePeriodsStore.error"
          type="error"
          variant="tonal"
          closable
          @click:close="schedulePeriodsStore.clearError"
          class="error-alert"
        >
          {{ schedulePeriodsStore.error }}
        </v-alert>

        <div class="grid-container">
          <Grid
            ref="kendoGrid"
            :data-items="result.data || []"
            :total="filteredSchedulePeriods.length"
            :columns="columnsWithSelection"
            :style="{ height: '500px' }"
            :sortable="true"
            :key="gridKey"
            :pageable="pageableConfig"
            :groupable="true"
            :group="group"
            :take="take"
            :skip="skip"
            :reorderable="true"
            :loading="schedulePeriodsStore.loading"
            :selected-field="selectedField"
            :filterable="false"
            class="scheduleperiods-grid"
            :filter="dataState.filter"
            :sort="dataState.sort"
            @datastatechange="dataStateChange"
            @selectionchange="onSelectionChange"
            @headerselectionchange="onHeaderSelectionChange"
            @rowclick="onRowClick"
            @expandchange="expandChange"
            @columnreorder="columnReorder"
            :expand-field="'expanded'"
          >
            <template #columnMenuTemplate="{ props }">
              <ColumnMenu
                :column="props.column"
                :filterable="props.filterable"
                :filter="props.filter"
                :sortable="props.sortable"
                :sort="props.sort"
                :columns="columns"
                @sortchange="(e) => props.onSortchange(e)"
                @filterchange="(e) => props.onFilterchange(e)"
                @closemenu="(e) => props.onClosemenu(e)"
                @contentfocus="(e) => props.onContentfocus(e)"
                @columnssubmit="onColumnsSubmit"
              />
            </template>

            <template #detailTemplate="{ props }">
              <SchedulePeriodDetailView
                :schedulePeriod="props.dataItem"
                @edit="openEditDialog"
                @delete="confirmDelete"
              />
            </template>
          </Grid>

          <div v-if="selectedGridSchedulePeriod" class="grid-row-actions">
            <v-chip class="selected-indicator" color="primary" variant="outlined">
              {{ $t('scheduleperiods.schedulePeriod') }}: {{ selectedGridSchedulePeriod.id }}
            </v-chip>

            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(selectedGridSchedulePeriod)"
              >
                {{ $t('common.edit') }}
              </v-btn>

              <v-btn
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(selectedGridSchedulePeriod)"
              >
                {{ $t('common.delete') }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditing
              ? $t('scheduleperiods.editSchedulePeriod')
              : $t('scheduleperiods.createNewSchedulePeriod')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="schedulePeriodForm" v-model="formValid" @submit.prevent="saveSchedulePeriod">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="currentSchedulePeriod.charging_profile_id"
                  :label="$t('scheduleperiods.chargingProfile')"
                  :items="availableChargingProfiles"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                  :no-data-text="$t('scheduleperiods.noChargingProfilesAvailable')"
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentSchedulePeriod.start_period_in_seconds"
                  :label="$t('scheduleperiods.startPeriodInSeconds')"
                  :placeholder="$t('forms.startPeriodPlaceholder')"
                  :rules="[rules.required, rules.startPeriodNumeric]"
                  variant="outlined"
                  type="number"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentSchedulePeriod.limit"
                  :label="$t('scheduleperiods.limit')"
                  :placeholder="$t('forms.limitPlaceholder')"
                  :rules="[rules.required, rules.limitRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="currentSchedulePeriod.number_phases"
                  :label="$t('scheduleperiods.numberPhases')"
                  :items="phaseOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveSchedulePeriod"
            :loading="schedulePeriodsStore.loading"
            :disabled="!formValid"
          >
            {{ isEditing ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">{{
          $t('scheduleperiods.deleteSchedulePeriod')
        }}</v-card-title>
        <v-card-text>
          {{ $t('scheduleperiods.confirmDelete', { id: selectedSchedulePeriod?.id || '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteSchedulePeriod"
            :loading="schedulePeriodsStore.loading"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialogOpen" max-width="900px" persistent>
      <v-card v-if="viewedSchedulePeriod" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary">mdi-calendar-clock</v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('scheduleperiods.schedulePeriod') }} {{ viewedSchedulePeriod.id }}
              </h2>
              <p class="header-subtitle">{{ $t('scheduleperiods.schedulePeriodDetails') }}</p>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="detailDialogOpen = false"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider"></v-divider>

        <v-card-text class="detail-content">
          <SchedulePeriodDetailView :schedulePeriod="viewedSchedulePeriod" :full-view="true" />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="detail-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            @click="confirmDelete(viewedSchedulePeriod)"
            class="action-btn"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            @click="openEditDialog(viewedSchedulePeriod)"
            class="action-btn"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import type {
  SchedulePeriod,
  CreateSchedulePeriodRequest,
  UpdateSchedulePeriodRequest
} from '@/types/scheduleperiods'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import SchedulePeriodDetailView from '@/components/SchedulePeriodDetailView.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const schedulePeriodsStore = useSchedulePeriodsStore()
const chargingProfilesStore = useChargingProfilesStore()
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const viewedSchedulePeriod = ref<SchedulePeriod | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedSchedulePeriod = ref<SchedulePeriod | null>(null)
const selectedGridSchedulePeriod = ref<SchedulePeriod | null>(null)
const schedulePeriodForm = ref()
const kendoGrid = ref()
const group = ref([])
const result = ref([])
const gridKey = ref(0)
const globalSearch = ref('')
const forceGridRefresh = () => gridKey.value++

const dataState = ref({
  take: 8,
  skip: 0
})
const skip = ref(0)
const take = ref(10)

const currentSchedulePeriod = reactive<Partial<SchedulePeriod>>({
  charging_profile_id: undefined,
  start_period_in_seconds: undefined,
  limit: undefined,
  number_phases: 1
})

const schedulePeriods = computed(() => schedulePeriodsStore.schedulePeriods)

const filteredSchedulePeriods = computed(() => {
  if (!globalSearch.value) {
    return schedulePeriods.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return schedulePeriods.value.filter(
    (period) =>
      period.charging_profile_id?.toString().includes(searchTerm) ||
      period.start_period_in_seconds?.toString().includes(searchTerm) ||
      period.limit?.toString().includes(searchTerm) ||
      period.number_phases?.toString().includes(searchTerm)
  )
})

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const phaseOptions = [
  { value: 1, title: t('scheduleperiods.onePhase') },
  { value: 2, title: t('scheduleperiods.twoPhases') },
  { value: 3, title: t('scheduleperiods.threePhases') }
]

const availableChargingProfiles = computed(() =>
  chargingProfilesStore.chargingProfiles.map((profile) => ({
    value: profile.id,
    title: `${profile.description || 'Profile ' + profile.id} (${profile.charging_profile_purpose})`
  }))
)

const staticColumns = [
  {
    field: 'id',
    title: t('scheduleperiods.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'charging_profile_id',
    title: t('scheduleperiods.chargingProfileId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'start_period_in_seconds',
    title: t('scheduleperiods.startPeriodInSeconds'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'limit',
    title: t('scheduleperiods.limit'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'number_phases',
    title: t('scheduleperiods.numberPhases'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  }
]

const areAllSelected = computed(
  () => filteredSchedulePeriods.value.findIndex((item) => item.selected === false) === -1
)

const columns = ref([...staticColumns])

const columnsWithSelection = computed(() => [
  { field: 'selected', width: '50px', headerSelectionValue: areAllSelected.value },
  ...columns.value
])

const rules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  chargingProfileIdNumeric: (value: number) =>
    (!isNaN(value) && value > 0) || t('scheduleperiods.validation.chargingProfileIdNumeric'),
  startPeriodNumeric: (value: number) =>
    (!isNaN(value) && value >= 0) || t('scheduleperiods.validation.startPeriodNumeric'),
  limitRange: (value: number) =>
    (value > 0 && value <= 1000) || t('scheduleperiods.validation.limitRange')
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  refreshData()
}

const columnReorder = (options) => {
  const newColumns = options.columns.filter((col) => col.field !== 'selected')
  columns.value = newColumns
}

function expandChange(event) {
  event.dataItem[event.target.$props.expandField] = event.value
}

const createDataState = (state) => {
  if (filteredSchedulePeriods.value && filteredSchedulePeriods.value.length > 0) {
    result.value = process(filteredSchedulePeriods.value.slice(0), state)
  } else {
    result.value = []
  }
  dataState.value = state
}

const dataStateChange = (e) => {
  if (e.event) {
    const isColumnActive = filterGroupByField(e.event.field, e.data.filter)
    const changedColumn = columns.value.find((column) => column.field === e.event.field)

    if (changedColumn) {
      changedColumn.headerClassName = isColumnActive ? 'customMenu active' : ''
    }
    createAppState(e.data)
  }
  createDataState(e.data)
}

const onColumnsSubmit = (columnsState) => {
  columns.value = columnsState
}

const refreshData = async () => {
  await Promise.all([
    schedulePeriodsStore.fetchSchedulePeriods(),
    chargingProfilesStore.fetchChargingProfiles()
  ])
  schedulePeriodsStore.schedulePeriods.forEach((period) => {
    if (!period.hasOwnProperty('selected')) {
      period.selected = false
    }
  })
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}

const viewSchedulePeriod = (period: SchedulePeriod) => {
  viewedSchedulePeriod.value = period
  detailDialogOpen.value = true
}

const openEditDialog = (period: SchedulePeriod) => {
  isEditing.value = true
  Object.assign(currentSchedulePeriod, period)
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentSchedulePeriod, {
    charging_profile_id: undefined,
    start_period_in_seconds: undefined,
    limit: undefined,
    number_phases: 1
  })
  if (schedulePeriodForm.value) {
    schedulePeriodForm.value.resetValidation()
  }
}

const saveSchedulePeriod = async () => {
  if (!schedulePeriodForm.value?.validate()) return

  const periodData = {
    charging_profile_id: Number(currentSchedulePeriod.charging_profile_id!),
    start_period_in_seconds: Number(currentSchedulePeriod.start_period_in_seconds!),
    limit: Number(currentSchedulePeriod.limit!),
    number_phases: Number(currentSchedulePeriod.number_phases!)
  }

  let success = false

  if (isEditing.value && currentSchedulePeriod.id) {
    const updateData: UpdateSchedulePeriodRequest = {
      ...periodData,
      id: currentSchedulePeriod.id
    }
    success = await schedulePeriodsStore.updateSchedulePeriod(updateData)
  } else {
    const createData: CreateSchedulePeriodRequest = periodData
    success = await schedulePeriodsStore.createSchedulePeriod(createData)
  }

  if (success) {
    closeDialog()
  }
}

const confirmDelete = (period: SchedulePeriod) => {
  selectedSchedulePeriod.value = period
  deleteDialogOpen.value = true
}

const deleteSchedulePeriod = async () => {
  if (selectedSchedulePeriod.value?.id) {
    const success = await schedulePeriodsStore.deleteSchedulePeriod(selectedSchedulePeriod.value.id)
    if (success) {
      deleteDialogOpen.value = false
      selectedSchedulePeriod.value = null
      selectedGridSchedulePeriod.value = null
    }
  }
}

function onHeaderSelectionChange(event) {
  const checked = event.event.target.checked
  schedulePeriodsStore.schedulePeriods = schedulePeriodsStore.schedulePeriods.map((item) => ({
    ...item,
    selected: checked
  }))
}

function onSelectionChange(event) {
  const updatedItem = {
    ...event.dataItem,
    selected: !event.dataItem.selected
  }

  const index = schedulePeriodsStore.schedulePeriods.findIndex((p) => p.id === updatedItem.id)
  if (index !== -1) {
    schedulePeriodsStore.schedulePeriods[index] = updatedItem
  }
}

function onRowClick(event) {
  if (event.dataItem) {
    viewSchedulePeriod(event.dataItem)
  }
}

const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('scheduleperiods.id'), type: 'number' },
      { key: 'charging_profile_id', title: t('scheduleperiods.chargingProfileId'), type: 'number' },
      {
        key: 'start_period_in_seconds',
        title: t('scheduleperiods.startPeriodInSeconds'),
        type: 'number'
      },
      { key: 'limit', title: t('scheduleperiods.limit'), type: 'number' },
      { key: 'number_phases', title: t('scheduleperiods.numberPhases'), type: 'number' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredSchedulePeriods.value,
      columns,
      title: t('scheduleperiods.title'),
      filename: `scheduleperiods_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('scheduleperiods.id'), type: 'number' },
      { key: 'charging_profile_id', title: t('scheduleperiods.chargingProfileId'), type: 'number' },
      {
        key: 'start_period_in_seconds',
        title: t('scheduleperiods.startPeriodInSeconds'),
        type: 'number'
      },
      { key: 'limit', title: t('scheduleperiods.limit'), type: 'number' },
      { key: 'number_phases', title: t('scheduleperiods.numberPhases'), type: 'number' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredSchedulePeriods.value,
      columns,
      title: t('scheduleperiods.title'),
      filename: `scheduleperiods_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('scheduleperiods.id'), type: 'number' },
      { key: 'charging_profile_id', title: t('scheduleperiods.chargingProfileId'), type: 'number' },
      {
        key: 'start_period_in_seconds',
        title: t('scheduleperiods.startPeriodInSeconds'),
        type: 'number'
      },
      { key: 'limit', title: t('scheduleperiods.limit'), type: 'number' },
      { key: 'number_phases', title: t('scheduleperiods.numberPhases'), type: 'number' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredSchedulePeriods.value,
      columns,
      title: t('scheduleperiods.title'),
      filename: `scheduleperiods_${new Date().toISOString().split('T')[0]}.csv`
    })
  } catch (error) {
    console.error('CSV export error:', error)
  }
}

onMounted(() => {
  createDataState({
    take: 8,
    skip: 0
  })
})

onMounted(async () => {
  await refreshData()
  createDataState({
    take: 8,
    skip: 0
  })
})

watch(
  filteredSchedulePeriods,
  (newValue) => {
    if (newValue.length > 0) {
      createDataState(dataState.value)
    }
  },
  { immediate: true }
)

watch(globalSearch, () => {
  createDataState(dataState.value)
})
</script>

<style scoped>
.scheduleperiods-management {
  padding: 16px;
}

.scheduleperiods-header {
  padding: 24px 24px 16px 24px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-container {
  min-width: 250px;
}

.search-field {
  max-width: 300px;
}

.export-actions {
  display: flex;
  gap: 8px;
}

.scheduleperiods-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.scheduleperiods-grid .k-grid-table tbody tr:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.export-btn {
  font-size: 0.875rem;
}

.error-alert {
  margin-bottom: 16px;
}

.grid-container {
  margin-top: 16px;
}

.scheduleperiods-grid {
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
}

.grid-row-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 12px;
  background-color: var(--v-theme-surface);
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
}

.selected-indicator {
  margin-right: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding: 8px 0;
}

.action-btn {
  margin: 0 2px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn .v-icon {
  font-size: 18px;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .export-actions {
    justify-content: center;
  }

  .export-btn {
    flex: 1;
    min-width: 0;
  }

  .search-container {
    min-width: auto;
  }
}

@media (max-width: 600px) {
  .scheduleperiods-management {
    padding: 8px;
  }

  .scheduleperiods-header {
    padding: 16px;
  }

  .export-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons-cell {
    flex-direction: column;
    align-items: center;
  }
}

th.k-header.customMenu > div > div > span.k-i-more-vertical::before,
th.k-header.customMenu.active > div > div > span.k-i-more-vertical::before {
  content: '\e129';
}

.k-columnmenu-item {
  display: none;
}

th.k-header.active > div > a {
  color: #fff;
  background-color: #ff6358;
}

/* Modern Detail Dialog Styles */
.modern-detail-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12),
    0 11px 15px -7px rgba(0, 0, 0, 0.2) !important;
}

.detail-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px 20px;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 4px 0 0;
  font-weight: 400;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.header-divider {
  border-color: rgba(255, 255, 255, 0.12);
  margin: 0;
}

.detail-content {
  padding: 32px !important;
  background: #fafafa;
  min-height: 200px;
}

.detail-actions {
  padding: 20px 32px 24px !important;
  background: white;
  gap: 12px;
}

.action-btn {
  border-radius: 8px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  padding: 0 20px !important;
  height: 44px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease;
}
</style>
