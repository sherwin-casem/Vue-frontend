  <!-- @ts-nocheck -->


<template>
  <div>
    <div class="sites-management">
      <v-card elevation="2">
        <v-card-title class="sites-header">
          <h1 class="text-h4">
            {{ $t('sites.title') }}
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            {{ $t('sites.manageAllSites') }}
          </p>
        </v-card-title>

        <v-card-text>
          <div class="action-bar">
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-plus"
              :disabled="sitesStore.loading"
              @click="openCreateDialog"
            >
              {{ $t('sites.addSite') }}
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
                  :disabled="!sites.length || sitesStore.loading"
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
              :loading="sitesStore.loading"
              @click="refreshData"
            />
          </div>

          <v-alert
            v-if="sitesStore.error"
            type="error"
            variant="tonal"
            closable
            class="error-alert"
            @click:close="sitesStore.clearError"
          >
            {{ sitesStore.error }}
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
              :total="filteredSites.length"
              :columns="columnsWithSelection"
              :style="{ height: '500px' }"
              :sortable="true"
              :pageable="pageableConfig"
              :groupable="true"
              :group="group"
              :take="take"
              :skip="skip"
              :reorderable="true"
              :loading="sitesStore.loading"
              :selected-field="selectedField"
              :filterable="false"
              class="sites-grid"
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

              <template #myTemplate="{ props }">
                <div
                  v-if="props.dataItem._loadingSiteData"
                  class="loading-container"
                >
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="24"
                  />
                  <span class="loading-text">Loading site data...</span>
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
                  <template #chargepoints>
                    <Grid
                      :columns="chargePointsColumns"
                      :data-items="props.dataItem._chargePoints || []"
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
              v-if="selectedGridSite"
              class="grid-row-actions"
            >
              <v-chip
                class="selected-indicator"
                color="primary"
                variant="outlined"
              >
                {{ $t('sites.site') }}: {{ selectedGridSite.name }}
              </v-chip>

              <div class="action-buttons">
                <v-btn
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-pencil"
                  @click="openEditDialog(selectedGridSite)"
                >
                  {{ $t('common.edit') }}
                </v-btn>

                <v-btn
                  size="small"
                  variant="outlined"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="confirmDelete(selectedGridSite)"
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
              isEditing ? $t('sites.editSite') : $t('sites.createNewSite')
            }}</span>
          </v-card-title>

          <v-card-text>
            <v-form
              ref="siteForm"
              v-model="formValid"
              @submit.prevent="saveSite"
            >
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="currentSite.name"
                    :label="$t('sites.siteName')"
                    :placeholder="$t('forms.siteNamePlaceholder')"
                    :rules="[rules.required, rules.nameMinLength]"
                    variant="outlined"
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="currentSite.address"
                    :label="$t('sites.address')"
                    :placeholder="$t('forms.addressPlaceholder')"
                    :rules="[rules.required, rules.addressMinLength]"
                    variant="outlined"
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="currentSite.postal_code"
                    :label="$t('sites.postalCode')"
                    :placeholder="$t('forms.postalCodePlaceholder')"
                    :rules="[rules.required, rules.postalCodeFormat]"
                    variant="outlined"
                    required
                  />
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="currentSite.city"
                    :label="$t('sites.city')"
                    :placeholder="$t('forms.cityPlaceholder')"
                    :rules="[rules.required, rules.cityMinLength]"
                    variant="outlined"
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="currentSite.country"
                    :label="$t('sites.country')"
                    :placeholder="$t('forms.countryPlaceholder')"
                    :rules="[rules.required, rules.countryMinLength]"
                    variant="outlined"
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="currentSite.note"
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
              :loading="sitesStore.loading"
              :disabled="!formValid"
              @click="saveSite"
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
            {{ $t('sites.deleteSite') }}
          </v-card-title>
          <v-card-text>
            {{ $t('sites.confirmDelete', { name: selectedSite?.name || '' }) }}
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
              :loading="sitesStore.loading"
              @click="deleteSite"
            >
              {{ $t('common.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
    <v-dialog
      v-model="detailDialogOpen"
      max-width="900px"
      persistent
    >
      <v-card
        v-if="viewedSite"
        class="modern-detail-card"
      >
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon
              class="header-icon"
              size="28"
              color="primary"
            >
              mdi-map-marker
            </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ viewedSite.name }}
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
          <SiteDetailView
            :site="viewedSite"
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
            @click="confirmDelete(viewedSite)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="openEditDialog(viewedSite)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectionToolbar
      :selected-count="selectedCount"
      :loading="sitesStore.loading"
      @export-selected="exportSelectedSites"
      @delete-selected="deleteSelectedSites"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, computed, onMounted, reactive, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useSitesStore } from '@/stores/sites'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useConnectorsStore } from '@/stores/connectors'
import type { Site, CreateSiteRequest, UpdateSiteRequest } from '@/types/sites'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import SiteDetailView from '@/components/SiteDetailView.vue'
import SelectionToolbar from '@/components/SelectionToolbar.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'
import { TabStrip } from '@progress/kendo-vue-layout'

const { t, d } = useI18n()
const selected = ref(0)
const { formatDate } = useLocaleFormatting()
const sitesStore = useSitesStore()
const chargePointsStore = useChargePointsStore()
const connectorsStore = useConnectorsStore()
const selectedField = 'selected'
const cellTemplate = ref('myTemplate')
const viewedSite = ref<Site | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedSite = ref<Site | null>(null)
const selectedGridSite = ref<Site | null>(null)
const siteForm = ref()
const globalSearch = ref('')
const kendoGrid = ref()
const group = ref([])
const result = ref([])
const gridKey = ref(0)
const successMessage = ref('')
const showSuccessAlert = ref(false)
const forceGridRefresh = () => gridKey.value++
const dataState = ref({
  take: 8,
  skip: 0
})
const skip = ref(0)
const take = ref(10)

const currentSite = reactive<Partial<Site>>({
  name: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  note: ''
})

const sites = computed(() => sitesStore.sites)

const selectedSites = computed(() => sites.value.filter((site) => site.selected === true))

const selectedCount = computed(() => selectedSites.value.length)

const filteredSites = computed(() => {
  if (!globalSearch.value) {
    return sites.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return sites.value.filter(
    (cp) =>
      cp.name?.toLowerCase().includes(searchTerm) ||
      cp.address?.toLowerCase().includes(searchTerm) ||
      cp.postal_code?.toLowerCase().includes(searchTerm) ||
      cp.city?.toLowerCase().includes(searchTerm) ||
      cp.country?.toString().includes(searchTerm)
  )
})


const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const tabs = ref([
  {title:"Details", content:'details'},
  { title: 'Charge points', content: 'chargepoints' },
  { title: 'Connectors', content: 'connectors' }
])

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

// All available columns with visibility control
const allColumns = ref([
  {
    field: 'site_id',
    title: t('sites.siteId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'name',
    title: t('sites.siteName'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    required: true
  },
  {
    field: 'address',
    title: t('sites.address'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'postal_code',
    title: t('sites.postalCode'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'city',
    title: t('sites.city'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'country',
    title: t('sites.country'),
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
const defaultVisibleColumns = ['name', 'address', 'city', 'country']

// Computed visible columns
const staticColumns = computed(() => {
  return allColumns.value.filter((col) => col.visible)
})

const areAllSelected = computed(
  () => filteredSites.value.findIndex((item) => item.selected === false) === -1
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

const rules = {
  required: (value: string) => !!value || t('validation.fieldRequired'),
  nameMinLength: (value: string) => value.length >= 3 || t('sites.validation.nameMinLength'),
  addressMinLength: (value: string) => value.length >= 5 || t('sites.validation.addressMinLength'),
  postalCodeFormat: (value: string) =>
    /^\d{4,10}$/.test(value) || t('sites.validation.postalCodeFormat'),
  cityMinLength: (value: string) => value.length >= 2 || t('sites.validation.cityMinLength'),
  countryMinLength: (value: string) => value.length >= 2 || t('sites.validation.countryMinLength')
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  refreshData()
}
const onSelect = (e) => {
  selected.value = e.selected
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

  // Fetch charge points and connectors when expanding a site
  if (event.value && event.dataItem.site_id) {
    // Set loading state
    event.dataItem._loadingSiteData = true
    try {
      // Fetch charge points for this site
      const siteChargePoints = chargePointsStore.getChargePointsBySiteId(event.dataItem.site_id)
      event.dataItem._chargePoints = siteChargePoints

      // Fetch connectors for this site
      const siteConnectors = await connectorsStore.fetchConnectorsBySiteId(event.dataItem.site_id)
      event.dataItem._connectors = siteConnectors
    } catch (error) {
      console.error('Error fetching site data:', error)
      event.dataItem._chargePoints = []
      event.dataItem._connectors = []
    } finally {
      event.dataItem._loadingSiteData = false
    }
  } else if (!event.value) {
    // Clear data when collapsing
    event.dataItem._chargePoints = []
    event.dataItem._connectors = []
    event.dataItem._loadingSiteData = false
  }
}

const createDataState = (state) => {
  if (filteredSites.value && filteredSites.value.length > 0) {
    result.value = process(filteredSites.value.slice(0), state)
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

const onColumnsSubmit = (columnsState: any[]) => {
  // Update the visible columns based on the column menu state
  const visibleFields = columnsState.map((col) => col.field)
  allColumns.value = allColumns.value.map((col) => ({
    ...col,
    visible: visibleFields.includes(col.field)
  }))
}

const refreshData = async () => {
  await Promise.all([
    sitesStore.fetchSites(),
    chargePointsStore.fetchChargePoints(),
    connectorsStore.fetchConnectors()
  ])
  sitesStore.sites.forEach((site) => {
    if (!site.hasOwnProperty('selected')) {
      site.selected = false
    }
  })
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}
const viewSite = (site: Site) => {
  viewedSite.value = site
  detailDialogOpen.value = true
}

const openEditDialog = (site: Site) => {
  isEditing.value = true
  Object.assign(currentSite, site)
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentSite, {
    name: '',
    address: '',
    postal_code: '',
    city: '',
    country: '',
    note: ''
  })
  if (siteForm.value) {
    siteForm.value.resetValidation()
  }
}

const saveSite = async () => {
  if (!siteForm.value?.validate()) return

  const siteData = {
    name: currentSite.name!,
    address: currentSite.address!,
    postal_code: currentSite.postal_code!,
    city: currentSite.city!,
    country: currentSite.country!,
    note: currentSite.note || ''
  }

  let success = false

  if (isEditing.value && currentSite.site_id) {
    const updateData: UpdateSiteRequest = {
      ...siteData,
      site_id: currentSite.site_id
    }
    success = await sitesStore.updateSite(updateData)
    if (success) {
      successMessage.value = t('sites.updated', { name: currentSite.name })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    const createData: CreateSiteRequest = siteData
    success = await sitesStore.createSite(createData)
    if (success) {
      successMessage.value = t('sites.created', { name: siteData.name })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeDialog()
    detailDialogOpen.value = false
    viewedSite.value = null
  }
}

const confirmDelete = (site: Site) => {
  selectedSite.value = site
  deleteDialogOpen.value = true
}

const deleteSite = async () => {
  if (selectedSite.value?.site_id) {
    const siteName = selectedSite.value.name
    const success = await sitesStore.deleteSite(selectedSite.value.site_id)
    if (success) {
      successMessage.value = t('sites.deleted', { name: siteName })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
      deleteDialogOpen.value = false
      detailDialogOpen.value = false
      selectedSite.value = null
      selectedGridSite.value = null
      viewedSite.value = null
      refreshData()
    }
  }
}

const clearSelection = () => {
  sitesStore.sites = sitesStore.sites.map((item) => ({
    ...item,
    selected: false
  }))
}

const deleteSelectedSites = async () => {
  const selectedIds = selectedSites.value
    .map((site) => site.site_id)
    .filter((id) => id !== undefined)

  if (selectedIds.length === 0) return

  let allSuccess = true
  for (const id of selectedIds) {
    const success = await sitesStore.deleteSite(id!)
    if (!success) allSuccess = false
  }

  if (allSuccess) {
    clearSelection()
    refreshData()
  }
}

const exportSelectedSites = async (format: 'pdf' | 'excel' | 'csv') => {
  try {
    const columns: ExportColumn[] = [
      { key: 'site_id', title: t('sites.siteId'), type: 'number' },
      { key: 'name', title: t('sites.siteName'), type: 'text' },
      { key: 'address', title: t('sites.address'), type: 'text' },
      { key: 'postal_code', title: t('sites.postalCode'), type: 'text' },
      { key: 'city', title: t('sites.city'), type: 'text' },
      { key: 'country', title: t('sites.country'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    const exportOptions = {
      data: selectedSites.value,
      columns,
      title: t('sites.selectedSites'),
      filename: `selected_sites_${new Date().toISOString().split('T')[0]}`
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
  sitesStore.sites = sitesStore.sites.map((item) => ({
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
  //   viewSite(event.dataItem)
  // }
}


const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'site_id', title: t('sites.siteId'), type: 'number' },
      { key: 'name', title: t('sites.siteName'), type: 'text' },
      { key: 'address', title: t('sites.address'), type: 'text' },
      { key: 'postal_code', title: t('sites.postalCode'), type: 'text' },
      { key: 'city', title: t('sites.city'), type: 'text' },
      { key: 'country', title: t('sites.country'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredSites.value,
      columns,
      title: t('sites.title'),
      filename: `sites_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'site_id', title: t('sites.siteId'), type: 'number' },
      { key: 'name', title: t('sites.siteName'), type: 'text' },
      { key: 'address', title: t('sites.address'), type: 'text' },
      { key: 'postal_code', title: t('sites.postalCode'), type: 'text' },
      { key: 'city', title: t('sites.city'), type: 'text' },
      { key: 'country', title: t('sites.country'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredSites.value,
      columns,
      title: t('sites.title'),
      filename: `sites_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'site_id', title: t('sites.siteId'), type: 'number' },
      { key: 'name', title: t('sites.siteName'), type: 'text' },
      { key: 'address', title: t('sites.address'), type: 'text' },
      { key: 'postal_code', title: t('sites.postalCode'), type: 'text' },
      { key: 'city', title: t('sites.city'), type: 'text' },
      { key: 'country', title: t('sites.country'), type: 'text' },
      { key: 'created_at', title: t('common.created'), type: 'date' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredSites.value,
      columns,
      title: t('sites.title'),
      filename: `sites_${new Date().toISOString().split('T')[0]}.csv`
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

onBeforeUnmount(() => {
  result.value = []
  selectedGridSite.value = null
  // expandedItems.value = []
  gridKey.value = Date.now() 
})

watch(
  filteredSites,
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

watch(globalSearch, () => {
  createDataState(dataState.value)
})
</script>

<style scoped>
.sites-management {
  padding: 16px;
}

.sites-header {
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

.sites-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.sites-grid .k-grid-table tbody tr:hover {
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

.sites-grid {
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

.search-container {
  min-width:300px !important;
}


.selected-indicator {
  margin-right: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
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
  .sites-management {
    padding: 8px;
  }

  .sites-header {
    padding: 16px;
  }

  .export-actions {
    flex-direction: column;
    gap: 8px;
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
  display: flex;
  align-items: start;
  justify-content: space-between;
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

/* Detail view styling */
.site-detail {
  padding: 16px;
}

.site-detail-row {
  display: flex;
  margin-bottom: 12px;
}

.site-detail-label {
  font-weight: 500;
  min-width: 120px;
  color: rgba(0, 0, 0, 0.6);
}

.site-detail-value {
  flex: 1;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .action-buttons-cell {
    flex-direction: column;
    align-items: center;
  }

  .site-detail-row {
    flex-direction: column;
  }

  .site-detail-label {
    margin-bottom: 4px;
  }
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
