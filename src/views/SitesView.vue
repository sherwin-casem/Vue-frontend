<template>
  <div class="sites-view">
    <v-container fluid>
      <v-row>
        <v-col>
          <h1 class="page-title">{{ $t('sites.title') }}</h1>

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
                {{ $t('sites.create') }}
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
                <div class="detail-container">
                  <h3>{{ $t('chargePoints.title') }} for {{ props.dataItem.name }}</h3>
                  <Grid
                    :data-items="getChargePointsForSite(props.dataItem.site_id)"
                    :columns="chargePointColumns"
                    :sortable="true"
                    :pageable="{ pageSize: 5 }"
                    style="margin: 20px"
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
          {{ editingItem ? $t('sites.edit') : $t('sites.create') }}
        </v-card-title>
        <v-card-text>
          <SiteForm :site="editingItem" @save="onSaveSite" @cancel="onCancelDialog" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="showViewDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ $t('sites.view') }}</v-card-title>
        <v-card-text>
          <div v-if="viewingItem">
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('sites.name') }}:</strong> {{ viewingItem.name }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('sites.city') }}:</strong> {{ viewingItem.city }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <strong>{{ $t('sites.address') }}:</strong> {{ viewingItem.address }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <strong>{{ $t('sites.country') }}:</strong> {{ viewingItem.country }}
              </v-col>
              <v-col cols="6">
                <strong>{{ $t('sites.postalCode') }}:</strong> {{ viewingItem.postal_code }}
              </v-col>
            </v-row>
            <v-row v-if="viewingItem.note">
              <v-col cols="12">
                <strong>{{ $t('sites.note') }}:</strong> {{ viewingItem.note }}
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
import { useSitesStore } from '@/stores/sites'
import { useChargePointsStore } from '@/stores/chargepoints'
import SiteForm from '@/components/SiteForm.vue'
import type { Site } from '@/types/sites'
import type { ChargePoint } from '@/types/chargepoints'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Stores
const sitesStore = useSitesStore()
const chargePointsStore = useChargePointsStore()

// Reactive data
const gridRef = ref()
const globalSearch = ref('')
const selectedItems = ref<Site[]>([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingItem = ref<Site | null>(null)
const viewingItem = ref<Site | null>(null)
const errorSnackbar = ref(false)

// Grid state
const take = ref(10)
const skip = ref(0)
const group = ref([])
const sort = ref([])
const filter = ref({ logic: 'and' as const, filters: [] })

// Computed properties
const loading = computed(() => sitesStore.loading || chargePointsStore.loading)
const error = computed(() => sitesStore.error || chargePointsStore.error)
const sites = computed(() => sitesStore.allSites)
const total = computed(() => sites.value.length)
const isAllSelected = computed(
  () => sites.value.length > 0 && selectedItems.value.length === sites.value.length
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
    field: 'site_id',
    title: 'ID',
    width: '80px',
    columnMenu: true
  },
  {
    field: 'name',
    title: 'Name',
    columnMenu: true
  },
  {
    field: 'address',
    title: 'Address',
    columnMenu: true
  },
  {
    field: 'city',
    title: 'City',
    columnMenu: true
  },
  {
    field: 'country',
    title: 'Country',
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

// Charge points columns for master-detail
const chargePointColumns = ref([
  {
    field: 'id',
    title: 'ID',
    width: '80px'
  },
  {
    field: 'ocpp_charge_box_id',
    title: 'OCPP ID'
  },
  {
    field: 'manufacturer',
    title: 'Manufacturer'
  },
  {
    field: 'model',
    title: 'Model'
  },
  {
    field: 'status',
    title: 'Status'
  }
])

// Process data for grid
const processedData = computed(() => {
  let data = sites.value
    .filter((site) => site && typeof site === 'object')
    .map((site) => ({
      ...site,
      selected: selectedItems.value.some((item) => item.site_id === site.site_id),
      // Ensure all required fields exist
      created_at: site.created_at || '',
      updated_at: site.updated_at || '',
      note: site.note || ''
    }))

  // Apply global search
  if (globalSearch.value) {
    const searchTerm = globalSearch.value.toLowerCase()
    data = data.filter(
      (site) =>
        site.name?.toLowerCase().includes(searchTerm) ||
        site.address?.toLowerCase().includes(searchTerm) ||
        site.city?.toLowerCase().includes(searchTerm) ||
        site.country?.toLowerCase().includes(searchTerm)
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

const toggleSelection = (item: Site) => {
  const index = selectedItems.value.findIndex((selected) => selected.site_id === item.site_id)

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
    selectedItems.value = [...sites.value]
  }
}

const onGlobalSearchChange = () => {
  // Trigger grid refresh
  skip.value = 0
}

const getChargePointsForSite = (siteId: number): ChargePoint[] => {
  return chargePointsStore.getChargePointsBySiteId(siteId)
}

const viewItem = (item: Site) => {
  viewingItem.value = item
  showViewDialog.value = true
}

const editItem = (item: Site) => {
  editingItem.value = { ...item }
  showCreateDialog.value = true
}

const deleteItem = async (item: Site) => {
  if (item.site_id && confirm(`Delete site "${item.name}"?`)) {
    await sitesStore.deleteSite(item.site_id)
  }
}

const deleteSelected = async () => {
  if (selectedItems.value.length === 0) return

  if (confirm(`Delete ${selectedItems.value.length} selected items?`)) {
    for (const item of selectedItems.value) {
      if (item.site_id) {
        await sitesStore.deleteSite(item.site_id)
      }
    }
    selectedItems.value = []
  }
}

const exportSelected = (format: 'xlsx' | 'pdf') => {
  const dataToExport = selectedItems.value.length > 0 ? selectedItems.value : sites.value

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((site) => ({
        ID: site.site_id,
        Name: site.name,
        Address: site.address,
        City: site.city,
        Country: site.country,
        'Postal Code': site.postal_code,
        Note: site.note || '',
        Created: formatDate(site.created_at)
      }))
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `sites-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  } else if (format === 'pdf') {
    const doc = new jsPDF()

    const tableData = dataToExport.map((site) => [
      site.site_id?.toString() || '',
      site.name || '',
      site.address || '',
      site.city || '',
      site.country || '',
      formatDate(site.created_at)
    ])

    autoTable(doc, {
      head: [['ID', 'Name', 'Address', 'City', 'Country', 'Created']],
      body: tableData,
      margin: { top: 20 },
      styles: { fontSize: 8 }
    })

    doc.save(`sites-export-${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

const onSaveSite = async (siteData: any) => {
  let success = false

  if (editingItem.value && editingItem.value.site_id) {
    // Update existing site
    success = await sitesStore.updateSite({ ...siteData, site_id: editingItem.value.site_id })
  } else {
    // Create new site
    success = await sitesStore.createSite(siteData)
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
  await Promise.all([sitesStore.fetchSites(), chargePointsStore.fetchChargePoints()])
})
</script>

<style scoped>
.sites-view {
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

.actions-cell {
  display: flex;
  gap: 4px;
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
