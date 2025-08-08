<!-- @ts-nocheck -->

<template>
  <div class="scheduleperiods-management">
    <v-card elevation="2">
      <v-card-title class="scheduleperiods-header">
        <h1 class="text-h4">
          {{ $t('scheduleperiods.title') }}
        </h1>
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
            :disabled="schedulePeriodsStore.loading"
            @click="openCreateDialog"
          >
            {{ $t('scheduleperiods.addSchedulePeriod') }}
          </v-btn>

          <v-spacer />

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
            />
          </div>

          <v-menu>
            <template #activator="{ props }">
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
                  <v-icon start> mdi-file-pdf-box </v-icon>
                  {{ $t('export.exportToPdf') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToExcel">
                <v-list-item-title>
                  <v-icon start> mdi-file-excel </v-icon>
                  {{ $t('export.exportToExcel') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToCsv">
                <v-list-item-title>
                  <v-icon start> mdi-file-delimited </v-icon>
                  {{ $t('export.exportToCsv') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-menu>
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-view-column"
                v-bind="props"
                class="column-selector-btn"
              >
                {{ $t('common.selectColumns') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="column in allColumns"
                :key="column.field"
                :disabled="column.required"
                @click="toggleColumn(column.field)"
              >
                <template #prepend>
                  <v-checkbox
                    :model-value="column.visible"
                    :disabled="column.required"
                    hide-details
                    @click.stop="toggleColumn(column.field)"
                  />
                </template>
                <v-list-item-title>{{ column.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            variant="text"
            icon="mdi-refresh"
            :loading="schedulePeriodsStore.loading"
            @click="refreshData"
          />
        </div>

        <v-alert
          v-if="schedulePeriodsStore.error"
          type="error"
          variant="tonal"
          closable
          class="error-alert"
          @click:close="schedulePeriodsStore.clearError"
        >
          {{ schedulePeriodsStore.error }}
        </v-alert>

        <v-alert
          v-if="showSuccessAlert"
          type="success"
          variant="tonal"
          closable
          class="success-alert"
          @click:close="showSuccessAlert = false"
        >
          {{ successMessage }}
        </v-alert>

        <div class="grid-container">
          <KendoLocalizationProvider :language="kendoLocale">
            <KendoIntlProvider :locale="kendoLocale.split('-')[0]">
              <Grid
                ref="kendoGrid"
                :key="gridKey"
                :data-items="result.data || []"
                :total="result.total || 0"
                :columns="columnsWithSelection"
                :style="{ height: '500px' }"
                :sortable="true"
                :pageable="pageableConfig"
                :groupable="true"
                :group="group"
                :take="take"
                :skip="skip"
                :reorderable="true"
                :loading="schedulePeriodsStore.loading"
                :disabled="schedulePeriodsStore.loading"
                :selected-field="selectedField"
                :filterable="false"
                class="scheduleperiods-grid"
                :filter="dataState.filter"
                :sort="dataState.sort"
                :detail="cellTemplate"
                :expand-field="'expanded'"
                @datastatechange="dataStateChange"
                @selectionchange="onSelectionChange"
                @headerselectionchange="onHeaderSelectionChange"
                @rowclick="onRowClick"
                @expandchange="expandChange"
                @columnreorder="columnReorder"
                  :loader="!result.data?.length || schedulePeriodsStore.loading"

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
                    :schedule-period="props.dataItem"
                    @edit="openEditDialog"
                    @delete="confirmDelete"
                  />
                </template>

                <template #myTemplate="{ props }">
                  <div v-if="props.dataItem._loadingChargingProfile" class="loading-container">
                    <v-progress-circular indeterminate color="primary" size="24" />
                    <span class="loading-text">Loading charging profile...</span>
                  </div>
                  <TabStrip
                    v-else
                    :selected="getRowTabState(props.dataItem.id)"
                    :tabs="tabs"
                    @select="(e) => onSelect(e, props.dataItem.id)"
                  >
                    <template #details>
                      <SchedulePeriodDetailView
                        :schedule-period="props.dataItem"
                        :full-view="true"
                        @edit="openEditDialog"
                        @delete="confirmDelete"
                      />
                    </template>
                    <template #chargingprofile>
                      <ChargingProfileDetailView
                        v-if="props.dataItem._chargingProfile"
                        :charging-profile="props.dataItem._chargingProfile"
                        :full-view="true"
                      />
                      <div v-else class="no-data-message">
                        {{ $t('scheduleperiods.noChargingProfileData') }}
                      </div>
                    </template>
                  </TabStrip>
                </template>

                <template #actionTemplate="{ props }">
                  <ActionCell :data-item="props.dataItem" @actionselect="handleRowAction" />
                </template>
              </Grid>
            </KendoIntlProvider>
          </KendoLocalizationProvider>

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
                />
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
                />
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
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="currentSchedulePeriod.number_phases"
                  :label="$t('scheduleperiods.numberPhases')"
                  :items="phaseOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="schedulePeriodsStore.loading"
            :disabled="!formValid"
            @click="saveSchedulePeriod"
          >
            {{ isEditing ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">
          {{ $t('scheduleperiods.deleteSchedulePeriod') }}
        </v-card-title>
        <v-card-text>
          {{ $t('scheduleperiods.confirmDelete', { id: selectedSchedulePeriod?.id || '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="schedulePeriodsStore.loading"
            @click="deleteSchedulePeriod"
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
            <v-icon class="header-icon" size="28" color="primary"> mdi-calendar-clock </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('scheduleperiods.schedulePeriod') }} {{ viewedSchedulePeriod.id }}
              </h2>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="close-btn"
            @click="detailDialogOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider" />

        <v-card-text class="detail-content">
          <SchedulePeriodDetailView :schedule-period="viewedSchedulePeriod" :full-view="true" />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="confirmDelete(viewedSchedulePeriod)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="openEditDialog(viewedSchedulePeriod)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectionToolbar
      :selected-count="selectedCount"
      :loading="schedulePeriodsStore.loading"
      @export-selected="exportSelectedSchedulePeriods"
      @delete-selected="deleteSelectedSchedulePeriods"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useKendoGridGlobalization } from '@/composables/useKendoGridGlobalization'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import type {
  SchedulePeriod,
  CreateSchedulePeriodRequest,
  UpdateSchedulePeriodRequest
} from '@/types/scheduleperiods'
import { useKendoGridTranslations } from '@/composables/useKendoGridTranslations'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import SchedulePeriodDetailView from '@/components/SchedulePeriodDetailView.vue'
import ChargingProfileDetailView from '@/components/ChargingProfileDetailView.vue'
import SelectionToolbar from '@/components/SelectionToolbar.vue'
import ActionCell from '@/components/ActionCell.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'
import { TabStrip } from '@progress/kendo-vue-layout'

const { t, locale } = useI18n()
const { kendoLocale, KendoLocalizationProvider, KendoIntlProvider } = useKendoGridGlobalization()
const schedulePeriodsStore = useSchedulePeriodsStore()
const { messages } = useKendoGridTranslations()
const chargingProfilesStore = useChargingProfilesStore()

// Grid messages are now handled by the globalization composable
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const rowTabStates = ref(new Map())
const selected = ref(0)
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
const successMessage = ref('')
const showSuccessAlert = ref(false)
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

const selectedSchedulePeriods = computed(() =>
  schedulePeriods.value.filter((period) => period.selected === true)
)

const selectedCount = computed(() => selectedSchedulePeriods.value.length)

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

const tabs = ref([
  { title:t('scheduleperiods.schedulePeriodDetails'), content: 'details' },
  { title: t('scheduleperiods.chargingProfile'), content: 'chargingprofile' }
])

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

// All available columns with visibility control
const allColumns = ref([
  {
    field: 'id',
    title: t('scheduleperiods.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    required: true
  },
  {
    field: 'charging_profile_id',
    title: t('scheduleperiods.chargingProfileId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'start_period_in_seconds',
    title: t('scheduleperiods.startPeriodInSeconds'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'limit',
    title: t('scheduleperiods.limit'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'number_phases',
    title: t('scheduleperiods.numberPhases'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  { title: t('common.actions'), cell: 'actionTemplate', width: '120px', visible: true }
])

// Default visible columns
const defaultVisibleColumns = ['id', 'charging_profile_id', 'start_period_in_seconds', 'limit']

// Computed visible columns
const staticColumns = computed(() => {
  return allColumns.value.filter((col) => col.visible)
})

const areAllSelected = computed(
  () => filteredSchedulePeriods.value.findIndex((item) => item.selected === false) === -1
)

const columns = computed(() => staticColumns.value)

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

function handleRowAction({ dataItem, action }) {
  switch (action) {
    case 'view':
      viewSchedulePeriod(dataItem)
      break
    case 'update':
      openEditDialog(dataItem)
      break
    case 'delete':
      confirmDelete(dataItem)
      break
  }
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  refreshData()
}

const columnReorder = (options: any) => {
  const newColumnOrder = options.columns.filter((col: any) => col.field !== 'selected')
  const reorderedColumns = newColumnOrder.map((newCol: any) => {
    const existingCol = allColumns.value.find((col) => col.field === newCol.field)
    return existingCol ? { ...existingCol, ...newCol } : newCol
  })

  allColumns.value = reorderedColumns
}
async function expandChange(event) {
  event.dataItem[event.target.$props.expandField] = event.value

  // Fetch charging profile when expanding a schedule period
  if (event.value && event.dataItem.charging_profile_id) {
    // Set loading state
    event.dataItem._loadingChargingProfile = true
    try {
      const profile = await chargingProfilesStore.fetchChargingProfileById(
        event.dataItem.charging_profile_id
      )
      // Store data in the specific row's data item
      event.dataItem._chargingProfile = profile
    } catch (error) {
      console.error('Error fetching charging profile:', error)
      event.dataItem._chargingProfile = null
    } finally {
      event.dataItem._loadingChargingProfile = false
    }
  } else if (!event.value) {
    // Clear data when collapsing
    event.dataItem._chargingProfile = null
    event.dataItem._loadingChargingProfile = false
    // Clear tab state for this row
    rowTabStates.value.delete(event.dataItem.id)
  }
}

const onSelect = (e, rowId) => {
  if (rowId) {
    rowTabStates.value.set(rowId, e.selected)
  } else {
    selected.value = e.selected
  }
}

const getRowTabState = (rowId) => {
  return rowTabStates.value.get(rowId) || 0
}

const createDataState = (state) => {
  if (filteredSchedulePeriods.value && filteredSchedulePeriods.value.length > 0) {
    result.value = process(filteredSchedulePeriods.value.slice(0), state)
  } else {
    result.value = { data: [], total: 0 }
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
    // createAppState(e.data)
  }
  createDataState(e.data)
}

// Function to toggle column visibility
const toggleColumn = (field: string) => {
  const column = allColumns.value.find((col) => col.field === field)
  if (column && !column.required) {
    column.visible = !column.visible
  }
}

const onColumnsSubmit = (columnsState) => {
  // Update the visible columns based on the column menu state
  const visibleFields = columnsState.map((col) => col.field)
  allColumns.value = allColumns.value.map((col) => ({
    ...col,
    visible: visibleFields.includes(col.field)
  }))
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
    if (success) {
      successMessage.value = t('scheduleperiods.updated')
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    const createData: CreateSchedulePeriodRequest = periodData
    success = await schedulePeriodsStore.createSchedulePeriod(createData)
    if (success) {
      successMessage.value = t('scheduleperiods.created')
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeDialog()
    detailDialogOpen.value = false
    viewedSchedulePeriod.value = null
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
      successMessage.value = t('scheduleperiods.deleted')
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
      deleteDialogOpen.value = false
      detailDialogOpen.value = false
      selectedSchedulePeriod.value = null
      selectedGridSchedulePeriod.value = null
      viewedSchedulePeriod.value = null
      refreshData()
    }
  }
}

const clearSelection = () => {
  schedulePeriodsStore.schedulePeriods = schedulePeriodsStore.schedulePeriods.map((item) => ({
    ...item,
    selected: false
  }))
}

const deleteSelectedSchedulePeriods = async () => {
  const selectedIds = selectedSchedulePeriods.value
    .map((p) => p.id)
    .filter((id) => id !== undefined)

  if (selectedIds.length === 0) return

  let allSuccess = true
  for (const id of selectedIds) {
    const success = await schedulePeriodsStore.deleteSchedulePeriod(id!)
    if (!success) allSuccess = false
  }

  if (allSuccess) {
    clearSelection()
    refreshData()
  }
}

const exportSelectedSchedulePeriods = async (format: 'pdf' | 'excel' | 'csv') => {
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

    const exportOptions = {
      data: selectedSchedulePeriods.value,
      columns,
      title: t('scheduleperiods.selectedSchedulePeriods'),
      filename: `selected_scheduleperiods_${new Date().toISOString().split('T')[0]}`
    }

    switch (format) {
      case 'pdf':
        await ExportUtils.exportToPDF({
          ...exportOptions,
          filename: exportOptions.filename + '.pdf'
        })
        break
      case 'excel':
        await ExportUtils.exportToExcel({
          ...exportOptions,
          filename: exportOptions.filename + '.xlsx'
        })
        break
      case 'csv':
        await ExportUtils.exportToCSV({
          ...exportOptions,
          filename: exportOptions.filename + '.csv'
        })
        break
    }
  } catch (error) {
    console.error('Selected export error:', error)
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
  event.dataItem[selectedField] = !event.dataItem[selectedField]
}

function onRowClick(event) {
  // if (event.dataItem && !event.dataItem.aggregates) {
  //   viewSchedulePeriod(event.dataItem)
  // }
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

.column-selector-btn {
  font-size: 0.875rem;
}

.error-alert,
.success-alert {
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
  background-color: var(--dialog-content-bg);
  min-height: 200px;
}

.detail-actions {
  padding: 20px 32px 24px !important;
  background-color: var(--dialog-content-bg);
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

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  background: #fafafa;
}

.loading-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.no-data-message {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
