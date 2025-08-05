  <!-- @ts-nocheck -->

<template>
  <div class="connectors-management">
    <v-card elevation="2">
      <v-card-title class="connectors-header">
        <h1 class="text-h4">
          {{ $t('connectors.title') }}
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('connectors.manageAllConnectors') }}
        </p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            :disabled="connectorsStore.loading"
            @click="openCreateDialog"
          >
            {{ $t('connectors.addConnector') }}
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
                :disabled="!connectors.length || connectorsStore.loading"
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
            :loading="connectorsStore.loading"
            @click="refreshData"
          />
        </div>

        <v-alert
          v-if="connectorsStore.error"
          type="error"
          variant="tonal"
          closable
          class="error-alert"
          @click:close="connectorsStore.clearError"
        >
          {{ connectorsStore.error }}
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
            :total="filteredConnectors.length"
            :columns="columnsWithSelection"
            :style="{ height: '500px' }"
            :sortable="true"
            :pageable="pageableConfig"
            :groupable="true"
            :group="group"
            :take="take"
            :skip="skip"
            :reorderable="true"
            :loading="connectorsStore.loading"
            :selected-field="selectedField"
            :filterable="false"
            class="connectors-grid"
            :filter="dataState.filter"
            :sort="dataState.sort"
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
              <ConnectorDetailView
                :connector="props.dataItem"
                @edit="openEditDialog"
                @delete="confirmDelete"
              />
            </template>
          </Grid>

          <div
            v-if="selectedGridConnector"
            class="grid-row-actions"
          >
            <v-chip
              class="selected-indicator"
              color="primary"
              variant="outlined"
            >
              {{ $t('connectors.connector') }}: {{ selectedGridConnector.connector_number }}
            </v-chip>

            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(selectedGridConnector)"
              >
                {{ $t('common.edit') }}
              </v-btn>

              <v-btn
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(selectedGridConnector)"
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
            isEditing ? $t('connectors.editConnector') : $t('connectors.createNewConnector')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="connectorForm"
            v-model="formValid"
            @submit.prevent="saveConnector"
          >
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="currentConnector.charge_point_id"
                  :label="$t('connectors.chargePoint')"
                  :items="availableChargePoints"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                  :no-data-text="$t('connectors.noChargePointsAvailable')"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentConnector.connector_number"
                  :label="$t('connectors.connectorNumber')"
                  :placeholder="$t('forms.connectorNumberPlaceholder')"
                  :rules="[rules.required, rules.connectorNumberRange]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentConnector.type"
                  :label="$t('connectors.type')"
                  :placeholder="$t('forms.connectorTypePlaceholder')"
                  :rules="[rules.required, rules.typeMinLength]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentConnector.max_power_kw"
                  :label="$t('connectors.maxPowerKw')"
                  :placeholder="$t('forms.maxPowerPlaceholder')"
                  :rules="[rules.required, rules.maxPowerRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentConnector.status"
                  :label="$t('connectors.status')"
                  :items="statusOptions"
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
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="connectorsStore.loading"
            :disabled="!formValid"
            @click="saveConnector"
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
          {{ $t('connectors.deleteConnector') }}
        </v-card-title>
        <v-card-text>
          {{
            $t('connectors.confirmDelete', { number: selectedConnector?.connector_number || '' })
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
            :loading="connectorsStore.loading"
            @click="deleteConnector"
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
        v-if="viewedConnector"
        class="modern-detail-card"
      >
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon
              class="header-icon"
              size="28"
              color="primary"
            >
              mdi-power-plug
            </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('connectors.connector') }} {{ viewedConnector.connector_number }}
              </h2>
              <p class="header-subtitle">
                {{ $t('connectors.connectorDetails') }}
              </p>
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
          <ConnectorDetailView
            :connector="viewedConnector"
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
            @click="confirmDelete(viewedConnector)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="openEditDialog(viewedConnector)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectionToolbar
      :selected-count="selectedCount"
      :loading="connectorsStore.loading"
      @export-selected="exportSelectedConnectors"
      @delete-selected="deleteSelectedConnectors"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useConnectorsStore } from '@/stores/connectors'
import { useChargePointsStore } from '@/stores/chargepoints'
import type { Connector, CreateConnectorRequest, UpdateConnectorRequest } from '@/types/connectors'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import ConnectorDetailView from '@/components/ConnectorDetailView.vue'
import SelectionToolbar from '@/components/SelectionToolbar.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const connectorsStore = useConnectorsStore()
const chargePointsStore = useChargePointsStore()
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const viewedConnector = ref<Connector | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedConnector = ref<Connector | null>(null)
const selectedGridConnector = ref<Connector | null>(null)
const connectorForm = ref()
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

const currentConnector = reactive<Partial<Connector>>({
  charge_point_id: undefined,
  connector_number: undefined,
  type: '',
  max_power_kw: undefined,
  status: 'available'
})

const connectors = computed(() => connectorsStore.connectors)

const selectedConnectors = computed(() =>
  connectors.value.filter((connector) => connector.selected === true)
)

const selectedCount = computed(() => selectedConnectors.value.length)

const filteredConnectors = computed(() => {
  if (!globalSearch.value) {
    return connectors.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return connectors.value.filter(
    (connector) =>
      connector.type?.toLowerCase().includes(searchTerm) ||
      connector.connector_number?.toString().includes(searchTerm) ||
      connector.charge_point_id?.toString().includes(searchTerm) ||
      connector.status?.toLowerCase().includes(searchTerm) ||
      connector.max_power_kw?.toString().includes(searchTerm)
  )
})

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const statusOptions = [
  { value: 'available', title: t('connectors.statusAvailable') },
  { value: 'faulted', title: t('connectors.statusFaulted') }
]

const availableChargePoints = computed(() =>
  chargePointsStore.chargePoints.map((cp) => ({
    value: cp.id,
    title: `${cp.ocpp_charge_box_id} (${cp.manufacturer} ${cp.model})`
  }))
)

// All available columns with visibility control
const allColumns = ref([
  {
    field: 'id',
    title: t('connectors.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    required: true
  },
  {
    field: 'charge_point_id',
    title: t('connectors.chargePointId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'connector_number',
    title: t('connectors.connectorNumber'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'type',
    title: t('connectors.type'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'max_power_kw',
    title: t('connectors.maxPowerKw'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'status',
    title: t('connectors.status'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'last_status_change',
    title: t('connectors.lastStatusChange'),
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false
  }
])

// Default visible columns
const defaultVisibleColumns = ['id', 'connector_number', 'type', 'max_power_kw', 'status']

// Computed visible columns
const staticColumns = computed(() => {
  return allColumns.value.filter((col) => col.visible)
})

const areAllSelected = computed(
  () => filteredConnectors.value.findIndex((item) => item.selected === false) === -1
)

const columns = computed(() => staticColumns.value)

const columnsWithSelection = computed(() => [
  { field: 'selected', width: '50px', headerSelectionValue: areAllSelected.value },
  ...columns.value
])

const rules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  chargePointIdNumeric: (value: number) =>
    (!isNaN(value) && value > 0) || t('connectors.validation.chargePointIdNumeric'),
  connectorNumberRange: (value: number) =>
    (value >= 1 && value <= 20) || t('connectors.validation.connectorNumberRange'),
  typeMinLength: (value: string) => value.length >= 2 || t('connectors.validation.typeMinLength'),
  maxPowerRange: (value: number) =>
    (value > 0 && value <= 1000) || t('connectors.validation.maxPowerRange')
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  refreshData()
}


function expandChange(event) {
  event.dataItem[event.target.$props.expandField] = event.value
}

const createDataState = (state) => {
  if (filteredConnectors.value && filteredConnectors.value.length > 0) {
    result.value = process(filteredConnectors.value.slice(0), state)
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
  await Promise.all([connectorsStore.fetchConnectors(), chargePointsStore.fetchChargePoints()])
  connectorsStore.connectors.forEach((connector) => {
    if (!connector.hasOwnProperty('selected')) {
      connector.selected = false
    }
  })
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}

const viewConnector = (connector: Connector) => {
  viewedConnector.value = connector
  detailDialogOpen.value = true
}

const openEditDialog = (connector: Connector) => {
  isEditing.value = true
  Object.assign(currentConnector, connector)
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentConnector, {
    charge_point_id: undefined,
    connector_number: undefined,
    type: '',
    max_power_kw: undefined,
    status: 'available'
  })
  if (connectorForm.value) {
    connectorForm.value.resetValidation()
  }
}

const saveConnector = async () => {
  if (!connectorForm.value?.validate()) return

  const connectorData = {
    charge_point_id: Number(currentConnector.charge_point_id!),
    connector_number: Number(currentConnector.connector_number!),
    type: currentConnector.type!,
    max_power_kw: Number(currentConnector.max_power_kw!),
    status: currentConnector.status! as 'available' | 'faulted'
  }

  let success = false

  if (isEditing.value && currentConnector.id) {
    const updateData: UpdateConnectorRequest = {
      ...connectorData,
      id: currentConnector.id
    }
    success = await connectorsStore.updateConnector(updateData)
    if (success) {
      successMessage.value = t('connectors.updated', { number: currentConnector.connector_number })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    const createData: CreateConnectorRequest = connectorData
    success = await connectorsStore.createConnector(createData)
    if (success) {
      successMessage.value = t('connectors.created', { number: connectorData.connector_number })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeDialog()
    detailDialogOpen.value = false
    viewedConnector.value = null
  }
}

const confirmDelete = (connector: Connector) => {
  selectedConnector.value = connector
  deleteDialogOpen.value = true
}

const deleteConnector = async () => {
  if (selectedConnector.value?.id) {
    const connectorNumber = selectedConnector.value.connector_number
    const success = await connectorsStore.deleteConnector(selectedConnector.value.id)
    if (success) {
      successMessage.value = t('connectors.deleted', { number: connectorNumber })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
      deleteDialogOpen.value = false
      detailDialogOpen.value = false
      selectedConnector.value = null
      selectedGridConnector.value = null
      viewedConnector.value = null
      refreshData()
    }
  }
}

const clearSelection = () => {
  connectorsStore.connectors = connectorsStore.connectors.map((item) => ({
    ...item,
    selected: false
  }))
}

const deleteSelectedConnectors = async () => {
  const selectedIds = selectedConnectors.value.map((c) => c.id).filter((id) => id !== undefined)

  if (selectedIds.length === 0) return

  let allSuccess = true
  for (const id of selectedIds) {
    const success = await connectorsStore.deleteConnector(id!)
    if (!success) allSuccess = false
  }

  if (allSuccess) {
    clearSelection()
    refreshData()
  }
}

const exportSelectedConnectors = async (format: 'pdf' | 'excel' | 'csv') => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('connectors.id'), type: 'number' },
      { key: 'charge_point_id', title: t('connectors.chargePointId'), type: 'number' },
      { key: 'connector_number', title: t('connectors.connectorNumber'), type: 'number' },
      { key: 'type', title: t('connectors.type'), type: 'text' },
      { key: 'max_power_kw', title: t('connectors.maxPowerKw'), type: 'number' },
      { key: 'status', title: t('connectors.status'), type: 'text' },
      { key: 'last_status_change', title: t('connectors.lastStatusChange'), type: 'date' }
    ]

    const exportOptions = {
      data: selectedConnectors.value,
      columns,
      title: t('connectors.selectedConnectors'),
      filename: `selected_connectors_${new Date().toISOString().split('T')[0]}`
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
  connectorsStore.connectors = connectorsStore.connectors.map((item) => ({
    ...item,
    selected: checked
  }))
}
const columnReorder = (options: any) => {
  const newColumnOrder = options.columns.filter((col: any) => col.field !== 'selected')
  const reorderedColumns = newColumnOrder.map((newCol: any) => {
    const existingCol = allColumns.value.find((col) => col.field === newCol.field)
    return existingCol ? { ...existingCol, ...newCol } : newCol
  })

  allColumns.value = reorderedColumns
}

function onSelectionChange(event) {
  event.dataItem[selectedField] = !event.dataItem[selectedField]
}
function onRowClick(event) {
  if (event.dataItem && !event.dataItem.aggregates) {
    viewConnector(event.dataItem)
  }
}

const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('connectors.id'), type: 'number' },
      { key: 'charge_point_id', title: t('connectors.chargePointId'), type: 'number' },
      { key: 'connector_number', title: t('connectors.connectorNumber'), type: 'number' },
      { key: 'type', title: t('connectors.type'), type: 'text' },
      { key: 'max_power_kw', title: t('connectors.maxPowerKw'), type: 'number' },
      { key: 'status', title: t('connectors.status'), type: 'text' },
      { key: 'last_status_change', title: t('connectors.lastStatusChange'), type: 'date' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredConnectors.value,
      columns,
      title: t('connectors.title'),
      filename: `connectors_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('connectors.id'), type: 'number' },
      { key: 'charge_point_id', title: t('connectors.chargePointId'), type: 'number' },
      { key: 'connector_number', title: t('connectors.connectorNumber'), type: 'number' },
      { key: 'type', title: t('connectors.type'), type: 'text' },
      { key: 'max_power_kw', title: t('connectors.maxPowerKw'), type: 'number' },
      { key: 'status', title: t('connectors.status'), type: 'text' },
      { key: 'last_status_change', title: t('connectors.lastStatusChange'), type: 'date' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredConnectors.value,
      columns,
      title: t('connectors.title'),
      filename: `connectors_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('connectors.id'), type: 'number' },
      { key: 'charge_point_id', title: t('connectors.chargePointId'), type: 'number' },
      { key: 'connector_number', title: t('connectors.connectorNumber'), type: 'number' },
      { key: 'type', title: t('connectors.type'), type: 'text' },
      { key: 'max_power_kw', title: t('connectors.maxPowerKw'), type: 'number' },
      { key: 'status', title: t('connectors.status'), type: 'text' },
      { key: 'last_status_change', title: t('connectors.lastStatusChange'), type: 'date' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredConnectors.value,
      columns,
      title: t('connectors.title'),
      filename: `connectors_${new Date().toISOString().split('T')[0]}.csv`
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
  filteredConnectors,
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
.connectors-management {
  padding: 16px;
}

.connectors-header {
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

.connectors-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.connectors-grid .k-grid-table tbody tr:hover {
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

.connectors-grid {
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
  .connectors-management {
    padding: 8px;
  }

  .connectors-header {
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
