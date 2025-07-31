<template>
  <div class="sites-container">
    <v-alert
      v-if="showSuccessAlert"
      type="success"
      class="success-alert"
      closable
      @click:close="hideSuccessMessage"
    >
      {{ successMessage }}
    </v-alert>

    <v-alert
      v-if="sitesStore.error"
      type="error"
      class="error-alert"
      closable
      @click:close="sitesStore.clearError()"
    >
      {{ sitesStore.error }}
    </v-alert>

    <div class="header-section">
      <h1 class="page-title">{{ $t('sites.title') }}</h1>
      <div class="header-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="create-btn">
          {{ $t('sites.addSite') }}
        </v-btn>
      </div>
    </div>

    <v-card class="data-grid-card" elevation="2">
      <EnhancedDataGrid
        :columns="advancedHeaders"
        :items="filteredSites"
        :loading="sitesStore.loading"
        :table-key="'sites'"
        :enable-selection="true"
        :selection-loading="selectionLoading"
        :delete-loading="deleteLoading"
        :delete-progress="deleteProgress"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        @export-selected="handleExportSelected"
        @delete-selected="handleDeleteSelected"
      >
        <template v-slot:item.country="{ item }">
          <div class="country-cell">
            <v-icon class="country-icon" size="small">mdi-flag</v-icon>
            {{ item.country }}
          </div>
        </template>

        <!-- <template v-slot:item.note="{ item }">
          <div class="note-cell">
            <span v-if="item.note && item.note.length > 30">
              <v-tooltip :text="item.note">
                <template v-slot:activator="{ props }">
                  <span v-bind="props">{{ item.note.substring(0, 30) }}...</span>
                </template>
              </v-tooltip>
            </span>
            <span v-else>{{ item.note || '-' }}</span>
          </div>
        </template> -->

        <template v-slot:item.created_at="{ item }">
          <span v-if="item.created_at">
            {{ formatDate(item.created_at) }}
          </span>
          <span v-else>-</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="actions-cell">
            <v-tooltip :text="$t('tooltips.viewDetails')" location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="text"
                  color="info"
                  size="small"
                  @click="openDetailDialog(item)"
                  :aria-label="$t('tooltips.viewDetails')"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip :text="$t('tooltips.editItem')" location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="text"
                  color="primary"
                  size="small"
                  @click="openEditDialog(item)"
                  :aria-label="$t('tooltips.editItem')"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip :text="$t('tooltips.deleteItem')" location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="text"
                  color="error"
                  size="small"
                  @click="openDeleteDialog(item)"
                  :aria-label="$t('tooltips.deleteItem')"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </EnhancedDataGrid>
    </v-card>

    <v-dialog v-model="showFormDialog" max-width="600px" persistent>
      <SiteForm
        :site="selectedSite"
        :loading="sitesStore.loading"
        @submit="handleFormSubmit"
        @cancel="closeFormDialog"
      />
    </v-dialog>

    <!-- Site Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="700px">
      <v-card class="site-detail-dialog">
        <v-card-title class="detail-title">
          <v-icon color="info" start>mdi-information</v-icon>
          {{ $t('sites.siteDetails') }}
        </v-card-title>

        <v-card-text>
          <v-container v-if="siteToView">
            <v-row>
              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('sites.siteId') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">{{
                      siteToView.site_id || 'N/A'
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('sites.siteName') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">{{ siteToView.name }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('sites.address') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">{{
                      siteToView.address
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('sites.postalCode') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      siteToView.postal_code
                    }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('sites.city') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">{{ siteToView.city }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('sites.country') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">{{
                      siteToView.country
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('common.created') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">
                      {{ siteToView.created_at ? formatDate(siteToView.created_at) : 'N/A' }}
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('common.updated') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">
                      {{ siteToView.updated_at ? formatDate(siteToView.updated_at) : 'N/A' }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-row v-if="siteToView.note">
              <v-col cols="12">
                <v-divider class="my-4" />
                <h4 class="note-title">{{ $t('common.notes') }}:</h4>
                <p class="note-content">{{ siteToView.note }}</p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeDetailDialog">
            {{ $t('common.close') }}
          </v-btn>
          <v-btn
            color="primary"
            class="pl-4 pr-4"
            variant="flat"
            v-if="siteToView"
            @click="() => {
              openEditDialog(siteToView!)
              closeDetailDialog()
            }"
          >
            <v-icon start>mdi-pencil</v-icon>
            {{ $t('sites.editSite') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card class="delete-dialog">
        <v-card-title class="delete-title">
          <v-icon color="error" start>mdi-delete</v-icon>
          {{ $t('sites.deleteSite') }}
        </v-card-title>

        <v-card-text>
          {{ $t('sites.confirmDelete', { name: siteToDelete?.name }) }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog" :disabled="sitesStore.loading">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete" :loading="sitesStore.loading">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSitesStore } from '@/stores/sites'
import SiteForm from '@/components/SiteForm.vue'

import EnhancedDataGrid from '@/components/EnhancedDataGrid.vue'
import type { Site, CreateSiteRequest, UpdateSiteRequest } from '@/types/sites'

const sitesStore = useSitesStore()
const { t, locale } = useI18n()

const selectedSite = ref<Site | null>(null)
const siteToDelete = ref<Site | null>(null)
const selectedSites = ref<Site[]>([])
const selectionLoading = ref(false)
const deleteLoading = ref(false)
const deleteProgress = ref(0)
const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)
const siteToView = ref<Site | null>(null)

const successMessage = ref('')
const showSuccessAlert = ref(false)

const expandedGroups = ref<string[]>([])

interface TableHeader {
  title: string
  key: string
  sortable: boolean
  width?: string
}

const headers = computed((): TableHeader[] => [
  { title: t('sites.siteId'), key: 'site_id', sortable: true, width: '80px' },
  { title: t('sites.siteName'), key: 'name', sortable: true },
  { title: t('sites.address'), key: 'address', sortable: true },
  { title: t('sites.postalCode'), key: 'postal_code', sortable: true },
  { title: t('sites.city'), key: 'city', sortable: true },
  { title: t('sites.country'), key: 'country', sortable: true },
  { title: t('common.note'), key: 'note', sortable: false },
  { title: t('common.created'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '160px' }
])

// Force reactivity key for translations
const translationKey = ref(0)

// Watch for locale changes to force header re-computation
watch(locale, () => {
  translationKey.value++
})

const advancedHeaders = computed(() => {
  translationKey.value
  return [
    {
      key: 'site_id',
      title: t('sites.siteId'),
      width: 80,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'name',
      title: t('sites.siteName'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'address',
      title: t('sites.address'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'postal_code',
      title: t('sites.postalCode'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'city',
      title: t('sites.city'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'country',
      title: t('sites.country'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'note',
      title: t('common.note'),

      sortable: false,
      type: 'text' as const
    },
    {
      key: 'created_at',
      title: t('common.created'),

      sortable: true,
      type: 'date' as const
    },
    {
      key: 'actions',
      title: t('common.actions'),
      width: 160,
      sortable: false,
      filterable: false,
      type: 'text' as const
    }
  ]
})

// Computed properties
const filteredSites = computed(() => {
  return sitesStore.allSites
})

// Methods
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

const openCreateDialog = (): void => {
  selectedSite.value = null
  showFormDialog.value = true
}

const openEditDialog = (site: Site): void => {
  selectedSite.value = site
  showFormDialog.value = true
}

const closeFormDialog = (): void => {
  selectedSite.value = null
  showFormDialog.value = false
}

const openDetailDialog = (site: Site): void => {
  siteToView.value = site
  showDetailDialog.value = true
}

const closeDetailDialog = (): void => {
  siteToView.value = null
  showDetailDialog.value = false
}

const openDeleteDialog = (site: Site): void => {
  siteToDelete.value = site
  showDeleteDialog.value = true
}

const closeDeleteDialog = (): void => {
  siteToDelete.value = null
  showDeleteDialog.value = false
}

const handleFormSubmit = async (data: CreateSiteRequest | UpdateSiteRequest): Promise<void> => {
  let success = false
  const isEdit = 'site_id' in data

  try {
    if (isEdit) {
      // Update existing site
      success = await sitesStore.updateSite(data as UpdateSiteRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('sites.updated', { name: data.name }))
      }
    } else {
      // Create new site
      success = await sitesStore.createSite(data as CreateSiteRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('sites.created', { name: data.name }))
      }
    }
  } catch (error) {
    console.error('Form submit error:', error)
    showErrorMessage(
      t(isEdit ? 'messages.updateError' : 'messages.createError', { item: t('sites.site') })
    )
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!siteToDelete.value?.site_id) return

  try {
    const siteName = siteToDelete.value.name
    const success = await sitesStore.deleteSite(siteToDelete.value.site_id)

    if (success) {
      closeDeleteDialog()
      showSuccessMessage(t('sites.deleted', { name: siteName }))
    }
  } catch (error) {
    console.error('Delete error:', error)
    showErrorMessage(t('messages.deleteError', { item: t('sites.site') }))
  }
}

// Export functions
const exportToPDF = async (): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default

    // Create a temporary table for PDF export
    const exportData = filteredSites.value.map((site) => ({
      [t('export.headers.id')]: site.site_id || '-',
      [t('export.headers.siteName')]: site.name,
      [t('export.headers.address')]: site.address,
      [t('export.headers.postalCode')]: site.postal_code,
      [t('export.headers.city')]: site.city,
      [t('export.headers.country')]: site.country,
      [t('export.headers.note')]: site.note || '-',
      [t('export.headers.created')]: site.created_at ? formatDate(site.created_at) : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4') // landscape orientation
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Add title
    pdf.setFontSize(16)
    pdf.text('Sites Export Report', 20, 20)

    // Add timestamp
    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Sites: ${exportData.length}`, 20, 35)

    // Create table content
    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 30, 40, 18, 20, 20, 30, 20]
    const headers = [
      t('export.headers.id'),
      t('export.headers.siteName'),
      t('export.headers.address'),
      t('export.headers.postal'),
      t('export.headers.city'),
      t('export.headers.country'),
      t('export.headers.note'),
      t('export.headers.created')
    ]

    // Draw headers
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'bold')
    let xPos = 20
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPos)
      xPos += colWidths[index]
    })

    yPos += rowHeight
    pdf.setFont(undefined, 'normal')

    // Draw data rows
    exportData.forEach((row) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 20
      Object.values(row).forEach((value, index) => {
        const text = String(value).substring(0, 25) // Limit text length
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    // Save the PDF
    const filename = `sites_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportToExcel = async (): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    // Prepare data for Excel export
    const exportData = filteredSites.value.map((site) => ({
      [t('export.headers.id')]: site.site_id || '',
      [t('export.headers.siteName')]: site.name,
      [t('export.headers.address')]: site.address,
      [t('export.headers.postalCode')]: site.postal_code,
      [t('export.headers.city')]: site.city,
      [t('export.headers.country')]: site.country,
      [t('export.headers.note')]: site.note || '',
      [t('export.headers.createdDate')]: site.created_at ? formatDate(site.created_at) : ''
    }))

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    // Set column widths
    const colWidths = [
      { wch: 10 }, // Site ID
      { wch: 25 }, // Site Name
      { wch: 30 }, // Address
      { wch: 12 }, // Postal Code
      { wch: 15 }, // City
      { wch: 15 }, // Country
      { wch: 30 }, // Note
      { wch: 15 } // Created Date
    ]
    ws['!cols'] = colWidths

    // Add metadata
    XLSX.utils.book_append_sheet(wb, ws, 'Sites')

    // Set workbook properties
    wb.Props = {
      Title: 'Sites Export',
      Subject: 'OCPP Sites Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    // Generate filename with timestamp
    const filename = `sites_export_${new Date().toISOString().split('T')[0]}.xlsx`

    // Save the file
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportToCSV = async (): Promise<void> => {
  try {
    // Prepare CSV data
    const headers = [
      t('export.headers.id'),
      t('export.headers.siteName'),
      t('export.headers.address'),
      t('export.headers.postalCode'),
      t('export.headers.city'),
      t('export.headers.country'),
      t('export.headers.note'),
      t('export.headers.createdDate')
    ]
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(','))

    // Add data rows
    filteredSites.value.forEach((site) => {
      const row = [
        `"${site.site_id || ''}"`,
        `"${site.name.replace(/"/g, '""')}"`,
        `"${site.address.replace(/"/g, '""')}"`,
        `"${site.postal_code}"`,
        `"${site.city.replace(/"/g, '""')}"`,
        `"${site.country.replace(/"/g, '""')}"`,
        `"${(site.note || '').replace(/"/g, '""')}"`,
        `"${site.created_at ? formatDate(site.created_at) : ''}"`
      ]
      csvRows.push(row.join(','))
    })

    // Create CSV content
    const csvContent = csvRows.join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `sites_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Notification methods
const showSuccessMessage = (message: string): void => {
  successMessage.value = message
  showSuccessAlert.value = true
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideSuccessMessage()
  }, 5000)
}

const hideSuccessMessage = (): void => {
  showSuccessAlert.value = false
  successMessage.value = ''
}

const showErrorMessage = (message: string): void => {
  sitesStore.error = message
}

// Batch selection methods
const clearSelection = (): void => {
  selectedItems.value = []
}

const handleBatchDelete = async (items: Site[]): Promise<void> => {
  if (items.length === 0) return

  batchDeleteLoading.value = true
  currentDeleteIndex.value = 0
  batchDeleteProgress.value = 0
  let successCount = 0
  let failedCount = 0
  const failedItems: string[] = []

  try {
    for (let i = 0; i < items.length; i++) {
      const site = items[i]
      currentDeleteIndex.value = i + 1
      batchDeleteProgress.value = ((i + 1) / items.length) * 100

      try {
        if (site.site_id) {
          const success = await sitesStore.deleteSite(site.site_id)
          if (success) {
            successCount++
            // Remove from selection immediately after successful deletion
            selectedItems.value = selectedItems.value.filter(
              (item) => item.site_id !== site.site_id
            )
          } else {
            failedCount++
            failedItems.push(site.name)
          }
        } else {
          failedCount++
          failedItems.push(site.name)
        }
      } catch (error) {
        console.error(`Failed to delete site ${site.name}:`, error)
        failedCount++
        failedItems.push(site.name)
      }

      // Small delay to show progress and prevent overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Clear any remaining selection after all deletions are attempted
    const remainingSelected = selectedItems.value.filter(
      (item) => !items.some((deletedItem) => deletedItem.site_id === item.site_id)
    )
    selectedItems.value = remainingSelected

    // Show result message
    if (failedCount === 0) {
      showSuccessMessage(t('messages.batchDeleteSuccess', { count: successCount }))
    } else if (successCount > 0) {
      showSuccessMessage(
        t('messages.batchDeletePartialSuccess', {
          success: successCount,
          failed: failedCount,
          failedItems: failedItems.join(', ')
        })
      )
    } else {
      showErrorMessage(
        t('messages.batchDeleteAllFailed', {
          failed: failedCount,
          failedItems: failedItems.join(', ')
        })
      )
    }
  } catch (error) {
    console.error('Batch delete error:', error)
    showErrorMessage(t('messages.batchDeleteFailed'))
  } finally {
    batchDeleteLoading.value = false
    currentDeleteIndex.value = 0
    batchDeleteProgress.value = 0
  }
}

const handleBatchExport = (format: string): void => {
  // Create a temporary filtered sites array with only selected items
  const originalSites = filteredSites.value
  const selectedSites = selectedItems.value

  try {
    switch (format) {
      case 'pdf':
        exportSelectedToPDF(selectedSites)
        break
      case 'excel':
        exportSelectedToExcel(selectedSites)
        break
      case 'csv':
        exportSelectedToCSV(selectedSites)
        break
    }
  } catch (error) {
    console.error('Batch export error:', error)
    showErrorMessage(t('messages.batchExportError'))
  }
}

// Export methods for selected items
const exportSelectedToPDF = async (selectedSites: Site[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = selectedSites.map((site) => ({
      'Site ID': site.site_id || '-',
      'Site Name': site.name,
      Address: site.address,
      'Postal Code': site.postal_code,
      City: site.city,
      Country: site.country,
      Note: site.note || '-',
      Created: site.created_at ? formatDate(site.created_at) : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    pdf.setFontSize(16)
    pdf.text('Selected Sites Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Selected Sites: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 30, 40, 18, 20, 20, 30, 20]
    const headers = [
      t('export.headers.id'),
      t('export.headers.siteName'),
      t('export.headers.address'),
      t('export.headers.postal'),
      t('export.headers.city'),
      t('export.headers.country'),
      t('export.headers.note'),
      t('export.headers.created')
    ]

    pdf.setFontSize(9)
    pdf.setFont(undefined, 'bold')
    let xPos = 20
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPos)
      xPos += colWidths[index]
    })

    yPos += rowHeight
    pdf.setFont(undefined, 'normal')

    exportData.forEach((row) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 20
      Object.values(row).forEach((value, index) => {
        const text = String(value).substring(0, 25)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `selected_sites_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportSelectedToExcel = async (selectedSites: Site[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = selectedSites.map((site) => ({
      'Site ID': site.site_id || '',
      'Site Name': site.name,
      Address: site.address,
      'Postal Code': site.postal_code,
      City: site.city,
      Country: site.country,
      Note: site.note || '',
      'Created Date': site.created_at ? formatDate(site.created_at) : ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 10 },
      { wch: 25 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 }
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Selected Sites')

    wb.Props = {
      Title: 'Selected Sites Export',
      Subject: 'OCPP Selected Sites Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `selected_sites_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportSelectedToCSV = async (selectedSites: Site[]): Promise<void> => {
  try {
    const headers = [
      t('export.headers.id'),
      t('export.headers.siteName'),
      t('export.headers.address'),
      t('export.headers.postalCode'),
      t('export.headers.city'),
      t('export.headers.country'),
      t('export.headers.note'),
      t('export.headers.createdDate')
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    selectedSites.forEach((site) => {
      const row = [
        `"${site.site_id || ''}"`,
        `"${site.name.replace(/"/g, '""')}"`,
        `"${site.address.replace(/"/g, '""')}"`,
        `"${site.postal_code}"`,
        `"${site.city.replace(/"/g, '""')}"`,
        `"${site.country.replace(/"/g, '""')}"`,
        `"${(site.note || '').replace(/"/g, '""')}"`,
        `"${site.created_at ? formatDate(site.created_at) : ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `selected_sites_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Advanced DataGrid event handlers
const handleFilteredExport = (format: string, items: Site[]) => {
  switch (format) {
    case 'pdf':
      exportFilteredToPDF(items)
      break
    case 'excel':
      exportFilteredToExcel(items)
      break
    case 'csv':
      exportFilteredToCSV(items)
      break
  }
}

// Selection event handlers
const handleSelectionChange = (newSelection: Site[]) => {
  selectedSites.value = newSelection
}

const handleDeleteSelected = async (items: Site[]) => {
  if (items.length === 0) return

  try {
    let successCount = 0
    let failedCount = 0
    const failedItems: string[] = []

    for (const site of items) {
      try {
        if (site.site_id) {
          const success = await sitesStore.deleteSite(site.site_id)
          if (success) {
            successCount++
          } else {
            failedCount++
            failedItems.push(site.name)
          }
        } else {
          failedCount++
          failedItems.push(site.name)
        }
      } catch (error) {
        console.error(`Failed to delete site ${site.name}:`, error)
        failedCount++
        failedItems.push(site.name)
      }
    }

    // Show result message
    if (failedCount === 0) {
      showSuccessMessage(t('messages.batchDeleteSuccess', { count: successCount }))
    } else if (successCount > 0) {
      showSuccessMessage(
        t('messages.batchDeletePartialSuccess', {
          success: successCount,
          failed: failedCount,
          failedItems: failedItems.join(', ')
        })
      )
    } else {
      showErrorMessage(
        t('messages.batchDeleteAllFailed', {
          failed: failedCount,
          failedItems: failedItems.join(', ')
        })
      )
    }
  } catch (error) {
    console.error('Batch delete error:', error)
    showErrorMessage(t('messages.batchDeleteFailed'))
  }
}

const handleExportSelected = (format: 'pdf' | 'excel' | 'csv', items: Site[]) => {
  console.log(`Exporting ${items.length} selected sites to ${format}`)

  switch (format) {
    case 'pdf':
      exportSelectedToPDF(items)
      break
    case 'excel':
      exportSelectedToExcel(items)
      break
    case 'csv':
      exportSelectedToCSV(items)
      break
  }
}

const handleRowClick = (item: Site) => {
  // Handle row click - could open detail dialog
  console.log('Row clicked:', item)
  // Optionally open detail dialog:
  // openDetailDialog(item)
}

// Export methods for filtered sites
const exportFilteredToPDF = async (filteredSites: Site[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Filtered Sites Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Items: ${filteredSites.length}`, 20, 35)

    const filename = `filtered_sites_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportFilteredToExcel = async (filteredSites: Site[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')
    const exportData = filteredSites.map((site) => ({
      'Site ID': site.site_id || '',
      'Site Name': site.name,
      Address: site.address,
      'Postal Code': site.postal_code,
      City: site.city,
      Country: site.country,
      Note: site.note || '',
      'Created Date': site.created_at ? formatDate(site.created_at) : ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Sites')

    const filename = `filtered_sites_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportFilteredToCSV = async (filteredSites: Site[]): Promise<void> => {
  try {
    const headers = [
      'Site ID',
      'Site Name',
      'Address',
      'Postal Code',
      'City',
      'Country',
      'Note',
      'Created Date'
    ]
    const csvRows = [headers.join(',')]

    filteredSites.forEach((site) => {
      const row = [
        `"${site.site_id || ''}"`,
        `"${site.name.replace(/"/g, '""')}"`,
        `"${site.address.replace(/"/g, '""')}"`,
        `"${site.postal_code.replace(/"/g, '""')}"`,
        `"${site.city.replace(/"/g, '""')}"`,
        `"${site.country.replace(/"/g, '""')}"`,
        `"${(site.note || '').replace(/"/g, '""')}"`,
        `"${site.created_at ? formatDate(site.created_at) : ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const FileSaver = await import('file-saver')

    const filename = `filtered_sites_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await sitesStore.fetchSites()
    if (sitesStore.sites.length === 0 && !sitesStore.error) {
      showSuccessMessage(t('messages.sitesLoadedSuccess'))
    }
  } catch (error) {
    console.error('Failed to load sites:', error)
    showErrorMessage(t('messages.loadError', { item: t('sites.title') }))
  }
})
</script>

<style scoped>
.sites-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-background));
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filters-card {
  margin-bottom: 24px;
}

.success-alert {
  margin-bottom: 24px;
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 400px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.error-alert {
  margin-bottom: 24px;
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 400px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.data-grid-card {
  background: rgb(var(--v-theme-surface));
}

.sites-table {
  background: transparent;
}

.country-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.country-icon {
  color: rgb(var(--v-theme-primary));
}

.note-cell {
  max-width: 200px;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid rgb(var(--v-theme-outline));
}

.selection-info {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

.delete-dialog .delete-title {
  color: rgb(var(--v-theme-error));
  font-weight: 600;
}

.site-detail-dialog .detail-title {
  color: rgb(var(--v-theme-info));
  font-weight: 600;
  padding: 20px 24px 16px;
}

.site-detail-dialog .label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.site-detail-dialog .value {
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 4px;
}

.site-detail-dialog .note-title {
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.site-detail-dialog .note-content {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.5;
  margin: 0;
}

.site-detail-dialog .detail-actions {
  padding: 16px 24px 24px;
}

.export-actions {
  width: 100%;
}

/* Responsive table styles */
.sites-table {
  /* Enable horizontal scrolling on mobile */
  overflow-x: auto;
}

@media (max-width: 1200px) {
  .sites-table :deep(th),
  .sites-table :deep(td) {
    font-size: 0.875rem;
    padding: 8px 4px;
  }
}

@media (max-width: 960px) {
  .sites-container {
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .page-title {
    font-size: 1.75rem;
    text-align: center;
  }

  /* Stack filter controls vertically on mobile */
  .filters-card .v-row {
    flex-direction: column;
  }

  .filters-card .v-col {
    margin-bottom: 8px;
  }

  /* Improve table readability on mobile */
  .sites-table {
    font-size: 0.75rem;
  }

  .sites-table :deep(.v-data-table__wrapper) {
    overflow-x: auto;
  }

  /* Hide less important columns on mobile */
  .sites-table :deep(th):nth-child(3),
  .sites-table :deep(td):nth-child(3),
  .sites-table :deep(th):nth-child(4),
  .sites-table :deep(td):nth-child(4) {
    display: none;
  }

  /* Adjust action buttons for mobile */
  .actions-cell {
    flex-direction: column;
    gap: 2px;
  }

  .actions-cell .v-btn {
    min-width: 28px;
    height: 28px;
  }
}

@media (max-width: 600px) {
  /* Even more aggressive hiding on small screens */
  .sites-table :deep(th):nth-child(5),
  .sites-table :deep(td):nth-child(5),
  .sites-table :deep(th):nth-child(7),
  .sites-table :deep(td):nth-child(7) {
    display: none;
  }

  .header-actions {
    width: 100%;
  }

  .create-btn {
    width: 100%;
  }
}
</style>
