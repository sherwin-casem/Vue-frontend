<template>
  <div class="chargingprofiles-management">
    <v-card elevation="2">
      <v-card-title class="chargingprofiles-header">
        <h1 class="text-h4">{{ $t('chargingprofiles.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('chargingprofiles.manageAllChargingProfiles') }}
        </p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            :disabled="chargingProfilesStore.loading"
          >
            {{ $t('chargingprofiles.addChargingProfile') }}
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
                :disabled="!chargingProfiles.length || chargingProfilesStore.loading"
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
            :loading="chargingProfilesStore.loading"
          ></v-btn>
        </div>

        <v-alert
          v-if="chargingProfilesStore.error"
          type="error"
          variant="tonal"
          closable
          @click:close="chargingProfilesStore.clearError"
          class="error-alert"
        >
          {{ chargingProfilesStore.error }}
        </v-alert>

        <div class="grid-container">
          <Grid
            ref="kendoGrid"
            :data-items="result.data || []"
            :total="filteredChargingProfiles.length"
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
            :loading="chargingProfilesStore.loading"
            :selected-field="selectedField"
            :filterable="false"
            class="chargingprofiles-grid"
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
              <ChargingProfileDetailView
                :chargingProfile="props.dataItem"
                @edit="openEditDialog"
                @delete="confirmDelete"
              />
            </template>
          </Grid>

          <div v-if="selectedGridChargingProfile" class="grid-row-actions">
            <v-chip class="selected-indicator" color="primary" variant="outlined">
              {{ $t('chargingprofiles.chargingProfile') }}: {{ selectedGridChargingProfile.id }}
            </v-chip>

            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(selectedGridChargingProfile)"
              >
                {{ $t('common.edit') }}
              </v-btn>

              <v-btn
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(selectedGridChargingProfile)"
              >
                {{ $t('common.delete') }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditing
              ? $t('chargingprofiles.editChargingProfile')
              : $t('chargingprofiles.createNewChargingProfile')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="chargingProfileForm"
            v-model="formValid"
            @submit.prevent="saveChargingProfile"
          >
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.charge_point_id"
                  :label="$t('chargingprofiles.chargePoint')"
                  :items="availableChargePoints"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                  :no-data-text="$t('chargingprofiles.noChargePointsAvailable')"
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.stack_level"
                  :label="$t('chargingprofiles.stackLevel')"
                  :placeholder="$t('forms.stackLevelPlaceholder')"
                  :rules="[rules.required, rules.stackLevelRange]"
                  variant="outlined"
                  type="number"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.charging_profile_purpose"
                  :label="$t('chargingprofiles.purpose')"
                  :items="purposeOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.charging_profile_kind"
                  :label="$t('chargingprofiles.kind')"
                  :items="kindOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.recurrency_kind"
                  :label="$t('chargingprofiles.recurrencyKind')"
                  :items="recurrencyOptions"
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.min_charging_rate"
                  :label="$t('chargingprofiles.minChargingRate')"
                  :placeholder="$t('forms.minChargingRatePlaceholder')"
                  :rules="[rules.minChargingRateRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.valid_from"
                  :label="$t('chargingprofiles.validFrom')"
                  :rules="[rules.required]"
                  variant="outlined"
                  type="datetime-local"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.valid_to"
                  :label="$t('chargingprofiles.validTo')"
                  :rules="[rules.required]"
                  variant="outlined"
                  type="datetime-local"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.duration_in_seconds"
                  :label="$t('chargingprofiles.durationInSeconds')"
                  :placeholder="$t('forms.durationPlaceholder')"
                  :rules="[rules.durationRange]"
                  variant="outlined"
                  type="number"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.start_schedule"
                  :label="$t('chargingprofiles.startSchedule')"
                  variant="outlined"
                  type="datetime-local"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="currentChargingProfile.description"
                  :label="$t('chargingprofiles.description')"
                  :placeholder="$t('forms.descriptionPlaceholder')"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentChargingProfile.note"
                  :label="$t('common.note')"
                  :placeholder="$t('forms.notePlaceholder')"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
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
            @click="saveChargingProfile"
            :loading="chargingProfilesStore.loading"
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
          $t('chargingprofiles.deleteChargingProfile')
        }}</v-card-title>
        <v-card-text>
          {{ $t('chargingprofiles.confirmDelete', { id: selectedChargingProfile?.id || '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteChargingProfile"
            :loading="chargingProfilesStore.loading"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialogOpen" max-width="900px" persistent>
      <v-card v-if="viewedChargingProfile" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary">mdi-chart-line</v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('chargingprofiles.chargingProfile') }} {{ viewedChargingProfile.id }}
              </h2>
              <p class="header-subtitle">{{ $t('chargingprofiles.chargingProfileDetails') }}</p>
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
          <ChargingProfileDetailView :chargingProfile="viewedChargingProfile" :full-view="true" />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="detail-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            @click="confirmDelete(viewedChargingProfile)"
            class="action-btn"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            @click="openEditDialog(viewedChargingProfile)"
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
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useChargePointsStore } from '@/stores/chargepoints'
import type {
  ChargingProfile,
  CreateChargingProfileRequest,
  UpdateChargingProfileRequest
} from '@/types/chargingprofiles'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import ChargingProfileDetailView from '@/components/ChargingProfileDetailView.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const chargingProfilesStore = useChargingProfilesStore()
const chargePointsStore = useChargePointsStore()
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const viewedChargingProfile = ref<ChargingProfile | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedChargingProfile = ref<ChargingProfile | null>(null)
const selectedGridChargingProfile = ref<ChargingProfile | null>(null)
const chargingProfileForm = ref()
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

const currentChargingProfile = reactive<Partial<ChargingProfile>>({
  charge_point_id: undefined,
  stack_level: 0,
  charging_profile_purpose: 'TxDefault',
  charging_profile_kind: 'Absolute',
  recurrency_kind: undefined,
  valid_from: '',
  valid_to: '',
  duration_in_seconds: undefined,
  start_schedule: undefined,
  min_charging_rate: undefined,
  description: '',
  note: ''
})

const chargingProfiles = computed(() => chargingProfilesStore.chargingProfiles)

const filteredChargingProfiles = computed(() => {
  if (!globalSearch.value) {
    return chargingProfiles.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return chargingProfiles.value.filter(
    (profile) =>
      profile.charge_point_id?.toString().includes(searchTerm) ||
      profile.charging_profile_purpose?.toLowerCase().includes(searchTerm) ||
      profile.charging_profile_kind?.toLowerCase().includes(searchTerm) ||
      profile.description?.toLowerCase().includes(searchTerm) ||
      profile.note?.toLowerCase().includes(searchTerm)
  )
})

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const purposeOptions = [
  { value: 'TxDefault', title: 'Tx Default' },
  { value: 'TxProfile', title: 'Tx Profile' },
  { value: 'TxMaxProfile', title: 'Tx Max Profile' }
]

const kindOptions = [
  { value: 'Absolute', title: 'Absolute' },
  { value: 'Recurring', title: 'Recurring' },
  { value: 'Relative', title: 'Relative' }
]

const recurrencyOptions = [
  { value: null, title: t('common.none') },
  { value: 'Daily', title: 'Daily' },
  { value: 'Weekly', title: 'Weekly' }
]

const availableChargePoints = computed(() =>
  chargePointsStore.chargePoints.map((cp) => ({
    value: cp.id,
    title: `${cp.ocpp_charge_box_id} (${cp.manufacturer} ${cp.model})`
  }))
)

const staticColumns = [
  {
    field: 'id',
    title: t('chargingprofiles.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'charge_point_id',
    title: t('chargingprofiles.chargePointId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'stack_level',
    title: t('chargingprofiles.stackLevel'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'charging_profile_purpose',
    title: t('chargingprofiles.purpose'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'charging_profile_kind',
    title: t('chargingprofiles.kind'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'valid_from',
    title: t('chargingprofiles.validFrom'),
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu'
  },
  {
    field: 'valid_to',
    title: t('chargingprofiles.validTo'),
  }
]

const areAllSelected = computed(
  () => filteredChargingProfiles.value.findIndex((item) => item.selected === false) === -1
)

const columns = ref([...staticColumns])

const columnsWithSelection = computed(() => [
  { field: 'selected', width: '50px', headerSelectionValue: areAllSelected.value },
  ...columns.value
])

const rules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  chargePointIdNumeric: (value: number) =>
    (!isNaN(value) && value > 0) || t('chargingprofiles.validation.chargePointIdNumeric'),
  stackLevelRange: (value: number) =>
    (value >= 0 && value <= 99) || t('chargingprofiles.validation.stackLevelRange'),
  minChargingRateRange: (value: number) =>
    !value || (value > 0 && value <= 1000) || t('chargingprofiles.validation.minChargingRateRange'),
  durationRange: (value: number) =>
    !value || (value > 0 && value <= 86400) || t('chargingprofiles.validation.durationRange')
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
  if (filteredChargingProfiles.value && filteredChargingProfiles.value.length > 0) {
    result.value = process(filteredChargingProfiles.value.slice(0), state)
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
    chargingProfilesStore.fetchChargingProfiles(),
    chargePointsStore.fetchChargePoints()
  ])
  chargingProfilesStore.chargingProfiles.forEach((profile) => {
    if (!profile.hasOwnProperty('selected')) {
      profile.selected = false
    }
  })
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}

const viewChargingProfile = (profile: ChargingProfile) => {
  viewedChargingProfile.value = profile
  detailDialogOpen.value = true
}

const openEditDialog = (profile: ChargingProfile) => {
  isEditing.value = true
  Object.assign(currentChargingProfile, profile)
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentChargingProfile, {
    charge_point_id: undefined,
    stack_level: 0,
    charging_profile_purpose: 'TxDefault',
    charging_profile_kind: 'Absolute',
    recurrency_kind: undefined,
    valid_from: '',
    valid_to: '',
    duration_in_seconds: undefined,
    start_schedule: undefined,
    min_charging_rate: undefined,
    description: '',
    note: ''
  })
  if (chargingProfileForm.value) {
    chargingProfileForm.value.resetValidation()
  }
}

const saveChargingProfile = async () => {
  if (!chargingProfileForm.value?.validate()) return

  const profileData = {
    charge_point_id: Number(currentChargingProfile.charge_point_id!),
    stack_level: Number(currentChargingProfile.stack_level!),
    charging_profile_purpose: currentChargingProfile.charging_profile_purpose! as
      | 'TxDefault'
      | 'TxProfile'
      | 'TxMaxProfile',
    charging_profile_kind: currentChargingProfile.charging_profile_kind! as
      | 'Absolute'
      | 'Recurring'
      | 'Relative',
    recurrency_kind: currentChargingProfile.recurrency_kind as 'Daily' | 'Weekly' | undefined,
    valid_from: currentChargingProfile.valid_from!,
    valid_to: currentChargingProfile.valid_to!,
    duration_in_seconds: currentChargingProfile.duration_in_seconds
      ? Number(currentChargingProfile.duration_in_seconds)
      : undefined,
    start_schedule: currentChargingProfile.start_schedule || undefined,
    min_charging_rate: currentChargingProfile.min_charging_rate
      ? Number(currentChargingProfile.min_charging_rate)
      : undefined,
    description: currentChargingProfile.description || '',
    note: currentChargingProfile.note || ''
  }

  let success = false

  if (isEditing.value && currentChargingProfile.id) {
    const updateData: UpdateChargingProfileRequest = {
      ...profileData,
      id: currentChargingProfile.id
    }
    success = await chargingProfilesStore.updateChargingProfile(updateData)
  } else {
    const createData: CreateChargingProfileRequest = profileData
    success = await chargingProfilesStore.createChargingProfile(createData)
  }

  if (success) {
    closeDialog()
  }
}

const confirmDelete = (profile: ChargingProfile) => {
  selectedChargingProfile.value = profile
  deleteDialogOpen.value = true
}

const deleteChargingProfile = async () => {
  if (selectedChargingProfile.value?.id) {
    const success = await chargingProfilesStore.deleteChargingProfile(
      selectedChargingProfile.value.id
    )
    if (success) {
      deleteDialogOpen.value = false
      selectedChargingProfile.value = null
      selectedGridChargingProfile.value = null
    }
  }
}

function onHeaderSelectionChange(event) {
  const checked = event.event.target.checked
  chargingProfilesStore.chargingProfiles = chargingProfilesStore.chargingProfiles.map((item) => ({
    ...item,
    selected: checked
  }))
}

function onSelectionChange(event) {
  const updatedItem = {
    ...event.dataItem,
    selected: !event.dataItem.selected
  }

  const index = chargingProfilesStore.chargingProfiles.findIndex((p) => p.id === updatedItem.id)
  if (index !== -1) {
    chargingProfilesStore.chargingProfiles[index] = updatedItem
  }
}

function onRowClick(event) {
  if (event.dataItem) {
    viewChargingProfile(event.dataItem)
  }
}

const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredChargingProfiles.value,
      columns,
      title: t('chargingprofiles.title'),
      filename: `chargingprofiles_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredChargingProfiles.value,
      columns,
      title: t('chargingprofiles.title'),
      filename: `chargingprofiles_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredChargingProfiles.value,
      columns,
      title: t('chargingprofiles.title'),
      filename: `chargingprofiles_${new Date().toISOString().split('T')[0]}.csv`
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
  filteredChargingProfiles,
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
.chargingprofiles-management {
  padding: 16px;
}

.chargingprofiles-header {
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

.chargingprofiles-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chargingprofiles-grid .k-grid-table tbody tr:hover {
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

.chargingprofiles-grid {
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
  .chargingprofiles-management {
    padding: 8px;
  }

  .chargingprofiles-header {
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
