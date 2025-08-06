  <!-- @ts-nocheck -->
<template>
  <div class="chargepoints-management">
    <v-card elevation="2">
      <v-card-title class="chargepoints-header">
        <h1 class="text-h4">
          {{ $t('chargepoints.title') }}
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('chargepoints.manageAllChargePoints') }}
        </p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            :disabled="chargePointsStore.loading"
            @click="openCreateDialog"
          >
            {{ $t('chargepoints.addChargePoint') }}
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
                :disabled="!chargePoints.length || chargePointsStore.loading"
                class="export-btn"
              >
                {{ $t('export.export') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="exportToPdf">
                <v-list-item-title>
                  <v-icon start>
                    mdi-file-pdf-box
                  </v-icon>
                  {{ $t('export.exportToPdf') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToExcel">
                <v-list-item-title>
                  <v-icon start>
                    mdi-file-excel
                  </v-icon>
                  {{ $t('export.exportToExcel') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToCsv">
                <v-list-item-title>
                  <v-icon start>
                    mdi-file-delimited
                  </v-icon>
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
            :loading="chargePointsStore.loading"
            @click="refreshData"
          />
        </div>

        <v-alert
          v-if="chargePointsStore.error"
          type="error"
          variant="tonal"
          closable
          class="error-alert"
          @click:close="chargePointsStore.clearError"
        >
          {{ chargePointsStore.error }}
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
          <Grid
            ref="kendoGrid"
            :key="gridKey"
            :data-items="result.data || []"
            :total="filteredChargePoints.length"
            :columns="columnsWithSelection"
            :style="{ height: '500px' }"
            :sortable="true"
            :pageable="pageableConfig"
            :groupable="true"
            :group="group"
            :take="take"
            :skip="skip"
            :reorderable="true"
            :loading="chargePointsStore.loading"
            :selected-field="selectedField"
            :filterable="false"
            class="chargepoints-grid"
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
              <ChargePointDetailView
                :charge-point="props.dataItem"
                @edit="openEditDialog"
                @delete="confirmDelete"
              />
            </template>

            <template #myTemplate="{ props }">
              <div
                v-if="props.dataItem._loadingProfiles"
                class="loading-container"
              >
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="24"
                />
                <span class="loading-text">Loading charging profiles...</span>
              </div>
               <TabStrip
                  v-else
                  :selected="selected"
                  :tabs="tabs"
                  @select="onSelect"
                >

                  <template #details>
                      {{ props.dataItem }}
                  </template>
                  <template #site>
                    {{props.dataItem.site}}
                  </template>
                
                  <template #chargingprofiles>
                     <Grid
                :columns="chargingProfilesColumns"
                :data-items="props.dataItem._chargingProfiles || []"
                :sortable="false"
                :groupable="false"
                :filterable="false"
              />
                  </template>
                  <template #connectors>
                    <Grid
                      :columns="connectorsColumns"
                      :data-items="props.dataItem._connectors || []"
                      :sortable="false"
                      :groupable="false"
                      :filterable="false"
                    />

                  </template>
                </TabStrip>
             
            </template>
          </Grid>

          <div
            v-if="selectedGridChargePoint"
            class="grid-row-actions"
          >
            <v-chip
              class="selected-indicator"
              color="primary"
              variant="outlined"
            >
              {{ $t('chargepoints.chargePoint') }}: {{ selectedGridChargePoint.ocpp_charge_box_id }}
            </v-chip>

            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(selectedGridChargePoint)"
              >
                {{ $t('common.edit') }}
              </v-btn>

              <v-btn
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(selectedGridChargePoint)"
              >
                {{ $t('common.delete') }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="dialogOpen"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditing ? $t('chargepoints.editChargePoint') : $t('chargepoints.createNewChargePoint')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="chargePointForm"
            v-model="formValid"
            @submit.prevent="saveChargePoint"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentChargePoint.ocpp_charge_box_id"
                  :label="$t('chargepoints.ocppChargeBoxId')"
                  :placeholder="$t('forms.ocppChargeBoxIdPlaceholder')"
                  :rules="[rules.required, rules.ocppIdMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="currentChargePoint.site_id"
                  :label="$t('chargepoints.site')"
                  :items="availableSites"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                  :no-data-text="$t('chargepoints.noSitesAvailable')"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargePoint.manufacturer"
                  :label="$t('chargepoints.manufacturer')"
                  :placeholder="$t('forms.manufacturerPlaceholder')"
                  :rules="[rules.required, rules.manufacturerMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargePoint.model"
                  :label="$t('chargepoints.model')"
                  :placeholder="$t('forms.modelPlaceholder')"
                  :rules="[rules.required, rules.modelMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargePoint.connector_count"
                  :label="$t('chargepoints.connectorCount')"
                  :placeholder="$t('forms.connectorCountPlaceholder')"
                  :rules="[rules.required, rules.connectorCountRange]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargePoint.status"
                  :label="$t('chargepoints.status')"
                  :items="statusOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentChargePoint.note"
                  :label="$t('common.note')"
                  :placeholder="$t('forms.notePlaceholder')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="chargePointsStore.loading"
            :disabled="!formValid"
            @click="saveChargePoint"
          >
            {{ isEditing ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="deleteDialogOpen"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h6">
          {{ $t('chargepoints.deleteChargePoint') }}
        </v-card-title>
        <v-card-text>
          {{
            $t('chargepoints.confirmDelete', { id: selectedChargePoint?.ocpp_charge_box_id || '' })
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteDialogOpen = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="chargePointsStore.loading"
            @click="deleteChargePoint"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="detailDialogOpen"
      max-width="900px"
      persistent
    >
      <v-card
        v-if="viewedChargePoint"
        class="modern-detail-card"
      >
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon
              class="header-icon"
              size="28"
              color="primary"
            >
              mdi-ev-station
            </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ viewedChargePoint.ocpp_charge_box_id }}
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
          <ChargePointDetailView
            :charge-point="viewedChargePoint"
            :full-view="true"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="confirmDelete(viewedChargePoint)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="openEditDialog(viewedChargePoint)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectionToolbar
      :selected-count="selectedCount"
      :loading="chargePointsStore.loading"
      @export-selected="exportSelectedChargePoints"
      @delete-selected="deleteSelectedChargePoints"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useSitesStore } from '@/stores/sites'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import type {
  ChargePoint,
  CreateChargePointRequest,
  UpdateChargePointRequest
} from '@/types/chargepoints'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import ChargePointDetailView from '@/components/ChargePointDetailView.vue'
import SelectionToolbar from '@/components/SelectionToolbar.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'
import { TabStrip } from '@progress/kendo-vue-layout'


const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const chargePointsStore = useChargePointsStore()
const sitesStore = useSitesStore()
const selected = ref(0)
const chargingProfilesStore = useChargingProfilesStore()
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const viewedChargePoint = ref<ChargePoint | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedChargePoint = ref<ChargePoint | null>(null)
const selectedGridChargePoint = ref<ChargePoint | null>(null)
const chargePointForm = ref()
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

const currentChargePoint = reactive<Partial<ChargePoint>>({
  ocpp_charge_box_id: '',
  site_id: undefined,
  manufacturer: '',
  model: '',
  connector_count: undefined,
  status: 'active',
  note: ''
})

const chargePoints = computed(() => chargePointsStore.chargePoints)

const selectedChargePoints = computed(() => chargePoints.value.filter((cp) => cp.selected === true))

const selectedCount = computed(() => selectedChargePoints.value.length)

const filteredChargePoints = computed(() => {
  if (!globalSearch.value) {
    return chargePoints.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return chargePoints.value.filter(
    (cp) =>
      cp.ocpp_charge_box_id?.toLowerCase().includes(searchTerm) ||
      cp.manufacturer?.toLowerCase().includes(searchTerm) ||
      cp.model?.toLowerCase().includes(searchTerm) ||
      cp.status?.toLowerCase().includes(searchTerm) ||
      cp.site_id?.toString().includes(searchTerm)
  )
})

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const tabs = ref([
  {title:"Chargepoint Details", content:'details'},
  { title: 'Location details', content: 'site' },
  { title: 'Connectors', content: 'connectors' },
  {title:"Charging Profiles", content: 'chargingprofiles'},
])

const statusOptions = [
  { value: 'active', title: t('chargepoints.statusActive') },
  { value: 'inactive', title: t('chargepoints.statusInactive') },
  { value: 'faulty', title: t('chargepoints.statusFaulty') }
]

const availableSites = computed(() =>
  sitesStore.sites.map((site) => ({
    value: site.site_id,
    title: `${site.name} (${site.city})`
  }))
)
const connectorsColumns = [
  {
    field: 'connector_number',
    title: t('connectors.connectorNumber'),
    filterable: false
  },
  {
    field: 'type',
    title: t('connectors.type'),
    filterable: false
  },
  {
    field: 'max_power_kw',
    title: t('connectors.maxPowerKw'),
    filterable: false
  },
  {
    field: 'status',
    title: t('connectors.status'),
    filterable: false
  }
]
const chargePointsColumns = [
  {
    field: 'ocpp_charge_box_id',
    title: t('chargepoints.ocppChargeBoxId'),
    filter: 'text',
    filterable: false
  },
  {
    field: 'manufacturer',
    title: t('chargepoints.manufacturer'),
    filter: 'text',
    filterable: false
  },
  {
    field: 'model',
    title: t('chargepoints.model'),
    filter: 'text',
    filterable: false
  },
  {
    field: 'connector_count',
    title: t('chargepoints.connectorCount'),
    filter: 'numeric',
    filterable: false
  },
  {
    field: 'status',
    title: t('chargepoints.status'),
    filter: 'text',
    filterable: false
  }
]

const chargingProfilesColumns = [
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
    filterable: false
  },
  {
    field: 'charging_profile_kind',
    title: t('chargingprofiles.kind'),
    filterable: false
  },
  {
    field: 'valid_from',
    title: t('chargingprofiles.validFrom'),
    filterable: false
  },
  {
    field: 'valid_to',
    title: t('chargingprofiles.validTo'),
    filterable: false
  }
]

// All available columns with visibility control
const allColumns = ref([
  {
    field: 'id',
    title: t('chargepoints.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'ocpp_charge_box_id',
    title: t('chargepoints.ocppChargeBoxId'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    required: true,
    width:'150px'
  },
  {
    field: 'site_id',
    title: t('chargepoints.siteId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
   {
    field: 'site.name',
    title: t('sites.siteName'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    width:'150px'
  },
  {
    field: 'manufacturer',
    title: t('chargepoints.manufacturer'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'model',
    title: t('chargepoints.model'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'connector_count',
    title: t('chargepoints.connectorCount'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'status',
    title: t('chargepoints.status'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'created_at',
    title: t('common.created'),
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false
  }
])

// Default visible columns
const defaultVisibleColumns = [
  'ocpp_charge_box_id',
  'site_id',
  'manufacturer',
  'model',
  'connector_count',
  'status'
]

// Computed visible columns
const staticColumns = computed(() => {
  return allColumns.value.filter((col) => col.visible)
})

const areAllSelected = computed(
  () => filteredChargePoints.value.findIndex((item) => item.selected === false) === -1
)

const columns = computed(() => staticColumns.value)

const columnsWithSelection = computed(() => [
  { field: 'selected', width: '50px', headerSelectionValue: areAllSelected.value },
  ...columns.value
])

// Function to toggle column visibility
const toggleColumn = (field: string) => {
  const column = allColumns.value.find((col) => col.field === field)
  if (column && !column.required) {
    column.visible = !column.visible
  }
}

const onColumnsSubmit = (columnsState: any[]) => {
  // Update the visible columns based on the column menu state
  const visibleFields = columnsState.map((col) => col.field)
  allColumns.value = allColumns.value.map((col) => ({
    ...col,
    visible: visibleFields.includes(col.field)
  }))
}

const rules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  ocppIdMinLength: (value: string) =>
    value.length >= 3 || t('chargepoints.validation.ocppIdMinLength'),
  siteIdNumeric: (value: number) =>
    (!isNaN(value) && value > 0) || t('chargepoints.validation.siteIdNumeric'),
  manufacturerMinLength: (value: string) =>
    value.length >= 2 || t('chargepoints.validation.manufacturerMinLength'),
  modelMinLength: (value: string) =>
    value.length >= 2 || t('chargepoints.validation.modelMinLength'),
  connectorCountRange: (value: number) =>
    (value >= 1 && value <= 10) || t('chargepoints.validation.connectorCountRange')
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  refreshData()
}

const columnReorder = (options: any) => {
  // Handle column reordering while maintaining visibility state
  const newColumnOrder = options.columns.filter((col: any) => col.field !== 'selected')
  const reorderedColumns = newColumnOrder.map((newCol: any) => {
    const existingCol = allColumns.value.find((col) => col.field === newCol.field)
    return existingCol ? { ...existingCol, ...newCol } : newCol
  })

  // Update allColumns with new order
  allColumns.value = reorderedColumns
}

async function expandChange(event) {
  event.dataItem[event.target.$props.expandField] = event.value

  // Fetch charging profiles when expanding a charge point
  if (event.value && event.dataItem.id) {
    // Set loading state
    event.dataItem._loadingProfiles = true
    try {
      const profiles = await chargingProfilesStore.fetchChargingProfilesByChargePointId(
        event.dataItem.id
      )
      // Store data in the specific row's data item
      event.dataItem._chargingProfiles = profiles
    } catch (error) {
      console.error('Error fetching charging profiles:', error)
      event.dataItem._chargingProfiles = []
    } finally {
      event.dataItem._loadingProfiles = false
    }
  } else if (!event.value) {
    // Clear data when collapsing
    event.dataItem._chargingProfiles = []
    event.dataItem._loadingProfiles = false
  }
}

const createDataState = (state) => {
  if (filteredChargePoints.value && filteredChargePoints.value.length > 0) {
    result.value = process(filteredChargePoints.value.slice(0), state)
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

const refreshData = async () => {
  await Promise.all([chargePointsStore.fetchChargePoints(), sitesStore.fetchSites()])
  chargePointsStore.chargePoints.forEach((cp) => {
    if (!cp.hasOwnProperty('selected')) {
      cp.selected = false
    }
  })
}
const onSelect = (e) => {
  selected.value = e.selected
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}

const viewChargePoint = (chargePoint: ChargePoint) => {
  viewedChargePoint.value = chargePoint
  detailDialogOpen.value = true
}

const openEditDialog = (chargePoint: ChargePoint) => {
  isEditing.value = true
  Object.assign(currentChargePoint, chargePoint)
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentChargePoint, {
    ocpp_charge_box_id: '',
    site_id: undefined,
    manufacturer: '',
    model: '',
    connector_count: undefined,
    status: 'active',
    note: ''
  })
  if (chargePointForm.value) {
    chargePointForm.value.resetValidation()
  }
}

const saveChargePoint = async () => {
  if (!chargePointForm.value?.validate()) return

  const chargePointData = {
    ocpp_charge_box_id: currentChargePoint.ocpp_charge_box_id!,
    site_id: Number(currentChargePoint.site_id!),
    manufacturer: currentChargePoint.manufacturer!,
    model: currentChargePoint.model!,
    connector_count: Number(currentChargePoint.connector_count!),
    status: currentChargePoint.status! as 'active' | 'inactive' | 'faulty',
    note: currentChargePoint.note || ''
  }

  let success = false

  if (isEditing.value && currentChargePoint.id) {
    const updateData: UpdateChargePointRequest = {
      ...chargePointData,
      id: currentChargePoint.id
    }
    success = await chargePointsStore.updateChargePoint(updateData)
    if (success) {
      successMessage.value = t('chargepoints.updated', {
        id: currentChargePoint.ocpp_charge_box_id
      })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    const createData: CreateChargePointRequest = chargePointData
    success = await chargePointsStore.createChargePoint(createData)
    if (success) {
      successMessage.value = t('chargepoints.created', { id: chargePointData.ocpp_charge_box_id })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeDialog()
    detailDialogOpen.value = false
    viewedChargePoint.value = null
  }
}

const confirmDelete = (chargePoint: ChargePoint) => {
  selectedChargePoint.value = chargePoint
  deleteDialogOpen.value = true
}

const deleteChargePoint = async () => {
  if (selectedChargePoint.value?.id) {
    const chargePointId = selectedChargePoint.value.ocpp_charge_box_id
    const success = await chargePointsStore.deleteChargePoint(selectedChargePoint.value.id)
    if (success) {
      successMessage.value = t('chargepoints.deleted', { id: chargePointId })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
      deleteDialogOpen.value = false
      detailDialogOpen.value = false
      selectedChargePoint.value = null
      selectedGridChargePoint.value = null
      viewedChargePoint.value = null
      refreshData()
    }
  }
}

const clearSelection = () => {
  chargePointsStore.chargePoints = chargePointsStore.chargePoints.map((item) => ({
    ...item,
    selected: false
  }))
}

const deleteSelectedChargePoints = async () => {
  const selectedIds = selectedChargePoints.value.map((cp) => cp.id).filter((id) => id !== undefined)

  if (selectedIds.length === 0) return

  let allSuccess = true
  for (const id of selectedIds) {
    const success = await chargePointsStore.deleteChargePoint(id!)
    if (!success) allSuccess = false
  }

  if (allSuccess) {
    clearSelection()
    refreshData()
  }
}

const exportSelectedChargePoints = async (format: 'pdf' | 'excel' | 'csv') => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    const exportOptions = {
      data: selectedChargePoints.value,
      columns,
      title: t('chargepoints.selectedChargePoints'),
      filename: `selected_chargepoints_${new Date().toISOString().split('T')[0]}`
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
  chargePointsStore.chargePoints = chargePointsStore.chargePoints.map((item) => ({
    ...item,
    selected: checked
  }))
}
function onSelectionChange(event) {
  event.dataItem[selectedField] = !event.dataItem[selectedField]
}

function onRowClick(event) {
  // const nativeEvent = event.event;
  // let target = nativeEvent?.target;

  // if (!target) return;

  // while (target && target.nodeType !== 1) {
  //   target = target.parentNode;
  // }

  // const isHierarchyClick =
  //   target.closest('.k-hierarchy-cell') || target.closest('.k-i-expand') || target.closest('.k-icon');

  // const isActionClick = target.closest('.action-column') || target.closest('button') || target.closest('input[type="checkbox"]');

  // if (isHierarchyClick || isActionClick) {
  //   return;
  // }


  // if (event.dataItem && !event.dataItem.aggregates) {
  //   viewChargePoint(event.dataItem)
  // }
}

const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredChargePoints.value,
      columns,
      title: t('chargepoints.title'),
      filename: `chargepoints_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredChargePoints.value,
      columns,
      title: t('chargepoints.title'),
      filename: `chargepoints_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargepoints.id'), type: 'number' },
      { key: 'ocpp_charge_box_id', title: t('chargepoints.ocppChargeBoxId'), type: 'text' },
      { key: 'site_id', title: t('chargepoints.siteId'), type: 'number' },
      { key: 'manufacturer', title: t('chargepoints.manufacturer'), type: 'text' },
      { key: 'model', title: t('chargepoints.model'), type: 'text' },
      { key: 'connector_count', title: t('chargepoints.connectorCount'), type: 'number' },
      { key: 'status', title: t('chargepoints.status'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredChargePoints.value,
      columns,
      title: t('chargepoints.title'),
      filename: `chargepoints_${new Date().toISOString().split('T')[0]}.csv`
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
  filteredChargePoints,
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
.chargepoints-management {
  padding: 16px;
}

.chargepoints-header {
  padding: 24px 24px 16px 24px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.export-actions {
  display: flex;
  gap: 8px;
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

.chargepoints-grid {
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
}

.chargepoints-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chargepoints-grid .k-grid-table tbody tr:hover {
  background-color: rgba(25, 118, 210, 0.04);
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

.search-container {
  min-width:300px !important;
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
}

@media (max-width: 600px) {
  .chargepoints-management {
    padding: 8px;
  }

  .chargepoints-header {
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
</style>
