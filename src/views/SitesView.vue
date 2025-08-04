<template>
  <div class="sites-management">
    <v-card elevation="2">
      <v-card-title class="sites-header">
        <h1 class="text-h4">{{ $t('sites.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis">{{ $t('sites.manageAllSites') }}</p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn 
            color="primary" 
            variant="elevated"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            :disabled="sitesStore.loading"
          >
            {{ $t('sites.addSite') }}
          </v-btn>

          <v-spacer></v-spacer>

          <div class="export-actions">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-file-pdf-box"
              @click="exportToPdf"
              :disabled="!sites.length || sitesStore.loading"
              class="export-btn"
            >
              {{ $t('export.exportToPdf') }}
            </v-btn>
            
            <v-btn
              variant="outlined"
              prepend-icon="mdi-file-excel"
              @click="exportToExcel"
              :disabled="!sites.length || sitesStore.loading"
              class="export-btn"
            >
              {{ $t('export.exportToExcel') }}
            </v-btn>

            <v-btn
              variant="outlined"
              prepend-icon="mdi-file-delimited"
              @click="exportToCsv"
              :disabled="!sites.length || sitesStore.loading"
              class="export-btn"
            >
              {{ $t('export.exportToCsv') }}
            </v-btn>
          </div>

          <v-btn
            variant="text"
            icon="mdi-refresh"
            @click="refreshData"
            :loading="sitesStore.loading"
          ></v-btn>
        </div>

        <v-alert
          v-if="sitesStore.error"
          type="error"
          variant="tonal"
          closable
          @click:close="sitesStore.clearError"
          class="error-alert"
        >
          {{ sitesStore.error }}
        </v-alert>

        <div class="grid-container">
          <Grid
            ref="kendoGrid"
            :data-items="result.data || []"
            :total="sites.length"
            :columns="columns"
            :style="{ height: '500px' }"
            :sortable="true"
            :pageable="pageableConfig"
            :groupable="true"
            :reorderable="true"
            :loading="sitesStore.loading"
            :selectable="{ enabled: true, mode: 'single' }"
            :filterable="false"
            class="sites-grid"
            :filter="dataState.filter"
            :sort="dataState.sort"
            @datastatechange="dataStateChange"
            @selectionchange="onSelectionChange"
            @rowdblclick="onRowDoubleClick"
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
          </Grid>

          <div v-if="selectedGridSite" class="grid-row-actions">
            <v-chip class="selected-indicator" color="primary" variant="outlined">
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

    <v-dialog v-model="dialogOpen" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ isEditing ? $t('sites.editSite') : $t('sites.createNewSite') }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="siteForm" v-model="formValid" @submit.prevent="saveSite">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentSite.name"
                  :label="$t('sites.siteName')"
                  :placeholder="$t('forms.siteNamePlaceholder')"
                  :rules="[rules.required, rules.nameMinLength]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="currentSite.address"
                  :label="$t('sites.address')"
                  :placeholder="$t('forms.addressPlaceholder')"
                  :rules="[rules.required, rules.addressMinLength]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentSite.postal_code"
                  :label="$t('sites.postalCode')"
                  :placeholder="$t('forms.postalCodePlaceholder')"
                  :rules="[rules.required, rules.postalCodeFormat]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentSite.city"
                  :label="$t('sites.city')"
                  :placeholder="$t('forms.cityPlaceholder')"
                  :rules="[rules.required, rules.cityMinLength]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="currentSite.country"
                  :label="$t('sites.country')"
                  :placeholder="$t('forms.countryPlaceholder')"
                  :rules="[rules.required, rules.countryMinLength]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentSite.note"
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
            @click="saveSite"
            :loading="sitesStore.loading"
            :disabled="!formValid"
          >
            {{ isEditing ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">{{ $t('sites.deleteSite') }}</v-card-title>
        <v-card-text>
          {{ $t('sites.confirmDelete', { name: selectedSite?.name || '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn 
            color="error" 
            variant="elevated"
            @click="deleteSite"
            :loading="sitesStore.loading"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive,watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid,filterGroupByField  } from '@progress/kendo-vue-grid'
import { useSitesStore } from '@/stores/sites'
import type { Site, CreateSiteRequest, UpdateSiteRequest } from '@/types/sites'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import { process } from '@progress/kendo-data-query'

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const sitesStore = useSitesStore()

const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedSite = ref<Site | null>(null)
const selectedGridSite = ref<Site | null>(null)
const siteForm = ref()
const kendoGrid = ref()
const result = ref([])
const dataState = ref({
    take: 8,
    skip: 0,
});

const currentSite = reactive<Partial<Site>>({
  name: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  note: ''
})

const sites = computed(() => sitesStore.sites)

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const columns = computed(() => [
  {
    field: 'site_id',
    title: t('sites.siteId'),
    width: '100px',
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
  },
  {
    field: 'name',
    title: t('sites.siteName'),
    width: '200px',
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
  },
  {
    field: 'address',
    title: t('sites.address'),
    width: '250px',
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
  },
  {
    field: 'postal_code',
    title: t('sites.postalCode'),
    width: '120px',
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
  },
  {
    field: 'city',
    title: t('sites.city'),
    width: '150px',
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
  },
  {
    field: 'country',
    title: t('sites.country'),
    width: '150px',
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
  },
  {
    field: 'created_at',
    title: t('common.created'),
    width: '140px',
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
  }
])

const rules = {
  required: (value: string) => !!value || t('validation.fieldRequired'),
  nameMinLength: (value: string) => value.length >= 3 || t('sites.validation.nameMinLength'),
  addressMinLength: (value: string) => value.length >= 5 || t('sites.validation.addressMinLength'),
  postalCodeFormat: (value: string) => /^\d{4,10}$/.test(value) || t('sites.validation.postalCodeFormat'),
  cityMinLength: (value: string) => value.length >= 2 || t('sites.validation.cityMinLength'),
  countryMinLength: (value: string) => value.length >= 2 || t('sites.validation.countryMinLength')
}

const createDataState = (state) => {
  if (sites.value && sites.value.length > 0) {
    result.value = process(sites.value.slice(0), state);
  } else {
    result.value = [];
  }
  dataState.value = state;
};

const dataStateChange = (e) => {
    if (e.event) {
        const isColumnActive = filterGroupByField(e.event.field, e.data.filter);
        const changedColumn = columns.value.find(
            (column) => column.field === e.event.field
        );

        if (changedColumn) {
            changedColumn.headerClassName = isColumnActive
                ? 'customMenu active'
                : '';
        }
    }
    createDataState(e.data);
};

const onColumnsSubmit = (columnsState) => {
    columns.value = columnsState;
};


const refreshData = async () => {
  await sitesStore.fetchSites()
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
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
  } else {
    const createData: CreateSiteRequest = siteData
    success = await sitesStore.createSite(createData)
  }

  if (success) {
    closeDialog()
  }
}

const confirmDelete = (site: Site) => {
  selectedSite.value = site
  deleteDialogOpen.value = true
}

const deleteSite = async () => {
  if (selectedSite.value?.site_id) {
    const success = await sitesStore.deleteSite(selectedSite.value.site_id)
    if (success) {
      deleteDialogOpen.value = false
      selectedSite.value = null
      selectedGridSite.value = null
    }
  }
}

const onSelectionChange = (event: any) => {
  const selection = event.selection
  if (selection && selection.length > 0) {
    selectedGridSite.value = selection[0].dataItem
  } else {
    selectedGridSite.value = null
  }
}

const onRowDoubleClick = (event: any) => {
  const site = event.dataItem
  if (site) {
    openEditDialog(site)
  }
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
      data: sites.value,
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
      data: sites.value,
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
      data: sites.value,
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
        skip: 0,
    });
});
onMounted(async () => {
  await refreshData();
  createDataState({
    take: 8,
    skip: 0,
  });
});

watch(sites, (newValue) => {
  if (newValue.length > 0) {
    createDataState(dataState.value);
  }
}, { immediate: true });

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

.export-btn {
  font-size: 0.875rem;
}

.error-alert {
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
</style>