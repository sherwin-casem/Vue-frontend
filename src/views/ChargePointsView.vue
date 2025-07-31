<template>
  <div class="chargepoints-container">
    <!-- Success Alert - Positioned at top for visibility -->
    <v-alert
      v-if="showSuccessAlert"
      type="success"
      class="success-alert"
      closable
      @click:close="hideSuccessMessage"
    >
      {{ successMessage }}
    </v-alert>

    <!-- Error Alert - Positioned at top for visibility -->
    <v-alert
      v-if="chargePointsStore.error"
      type="error"
      class="error-alert"
      closable
      @click:close="chargePointsStore.clearError()"
    >
      {{ chargePointsStore.error }}
    </v-alert>

    <!-- Header -->
    <div class="header-section">
      <h1 class="page-title">{{ $t('chargePoints.title') }}</h1>
      <div class="header-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="create-btn">
          {{ $t('chargePoints.addChargePoint') }}
        </v-btn>
      </div>
    </div>

    <!-- Data Grid -->
    <v-card class="data-grid-card" elevation="2">
      <EnhancedDataGrid
        :columns="advancedHeaders"
        :items="filteredChargePoints"
        :loading="chargePointsStore.loading"
        :table-key="'chargepoints'"
        :enable-selection="true"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        @export-selected="handleExportSelected"
        @delete-selected="handleDeleteSelected"
      >
        <!-- Status column with chip -->
        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ $t(`status.${item.status?.toLowerCase()}`) }}
          </v-chip>
        </template>

        <!-- Site column with site name -->
        <template v-slot:item.site_id="{ item }">
          <div class="site-cell">
            <v-icon class="site-icon" size="small">mdi-map-marker</v-icon>
            {{ getSiteName(item.site_id) }}
          </div>
        </template>

        <!-- Note column with tooltip -->
        <template v-slot:item.note="{ item }">
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
        </template>

        <!-- Created date column -->
        <template v-slot:item.created_at="{ item }">
          <span v-if="item.created_at">
            {{ formatDate(item.created_at) }}
          </span>
          <span v-else>-</span>
        </template>

        <!-- Actions column -->
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

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showFormDialog" max-width="700px" persistent>
      <ChargePointForm
        :charge-point="selectedChargePoint"
        :loading="chargePointsStore.loading"
        @submit="handleFormSubmit"
        @cancel="closeFormDialog"
      />
    </v-dialog>

    <!-- Charge Point Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="800px">
      <v-card class="chargepoint-detail-dialog">
        <v-card-title class="detail-title">
          <v-icon color="info" start>mdi-information</v-icon>
          {{ $t('chargePoints.chargePointDetails') }}
        </v-card-title>

        <v-card-text>
          <v-container v-if="chargePointToView">
            <v-row>
              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargePoints.chargePointId') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      chargePointToView.id || 'N/A'
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargePoints.ocppChargeBoxId') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      chargePointToView.ocpp_charge_box_id
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargePoints.site') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      getSiteName(chargePointToView.site_id)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargePoints.manufacturer') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      chargePointToView.manufacturer
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargePoints.model') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      chargePointToView.model
                    }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargePoints.connectorCount') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      chargePointToView.connector_count
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('common.status') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">
                      <v-chip
                        :color="getStatusColor(chargePointToView.status)"
                        size="small"
                        variant="tonal"
                      >
                        {{ $t(`status.${chargePointToView.status?.toLowerCase()}`) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('common.created') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">
                      {{
                        chargePointToView.created_at
                          ? formatDate(chargePointToView.created_at)
                          : 'N/A'
                      }}
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('common.updated') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">
                      {{
                        chargePointToView.updated_at
                          ? formatDate(chargePointToView.updated_at)
                          : 'N/A'
                      }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-row v-if="chargePointToView.note">
              <v-col cols="12">
                <v-divider class="my-4" />
                <h4 class="note-title">{{ $t('common.notes') }}:</h4>
                <p class="note-content">{{ chargePointToView.note }}</p>
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
            v-if="chargePointToView"
            @click="() => {
              openEditDialog(chargePointToView!)
              closeDetailDialog()
            }"
          >
            <v-icon start>mdi-pencil</v-icon>
            {{ $t('chargePoints.editChargePoint') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card class="delete-dialog">
        <v-card-title class="delete-title">
          <v-icon color="error" start>mdi-delete</v-icon>
          {{ $t('common.confirmDelete') }}
        </v-card-title>

        <v-card-text>
          {{
            $t('chargePoints.confirmDelete', {
              id: chargePointToDelete?.ocpp_charge_box_id
            })
          }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog" :disabled="chargePointsStore.loading">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="chargePointsStore.loading"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watchEffect, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useSitesStore } from '@/stores/sites'
import ChargePointForm from '@/components/ChargePointForm.vue'

import EnhancedDataGrid from '@/components/EnhancedDataGrid.vue'
import type {
  ChargePoint,
  CreateChargePointRequest,
  UpdateChargePointRequest
} from '@/types/chargepoints'

const chargePointsStore = useChargePointsStore()
const sitesStore = useSitesStore()
const { t, locale } = useI18n()
const { formatDate, formatNumber } = useLocaleFormatting()

// Reactive state
const selectedChargePoint = ref<ChargePoint | null>(null)
const chargePointToDelete = ref<ChargePoint | null>(null)
const chargePointToView = ref<ChargePoint | null>(null)
const selectedChargePoints = ref<ChargePoint[]>([])
const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)

const successMessage = ref('')
const showSuccessAlert = ref(false)

// Table headers
interface TableHeader {
  title: string
  key: string
  sortable: boolean
  width?: string
}

const headers = computed((): TableHeader[] => [
  { title: t('chargePoints.chargePointId'), key: 'id', sortable: true, width: '80px' },
  { title: t('chargePoints.ocppChargeBoxId'), key: 'ocpp_charge_box_id', sortable: true },
  { title: t('chargePoints.site'), key: 'site_id', sortable: true },
  { title: t('chargePoints.manufacturer'), key: 'manufacturer', sortable: true },
  { title: t('chargePoints.model'), key: 'model', sortable: true },
  { title: t('chargePoints.connectors'), key: 'connector_count', sortable: true, width: '120px' },
  { title: t('common.status'), key: 'status', sortable: true, width: '120px' },
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

// Advanced DataGrid headers configuration - reactive to language changes
const advancedHeaders = computed(() => {
  // Access translationKey to force reactivity
  translationKey.value
  return [
    {
      key: 'id',
      title: t('chargePoints.chargePointId'),
      width: 80,
      sortable: true,
      type: 'number'
    },
    {
      key: 'ocpp_charge_box_id',
      title: t('chargePoints.ocppChargeBoxId'),
      sortable: true,
      type: 'text'
    },
    {
      key: 'site_id',
      title: t('chargePoints.site'),
      sortable: true,
      type: 'number'
    },
    {
      key: 'manufacturer',
      title: t('chargePoints.manufacturer'),
      sortable: true,
      type: 'text'
    },
    {
      key: 'model',
      title: t('chargePoints.model'),
      sortable: true,
      type: 'text'
    },
    {
      key: 'connector_count',
      title: t('chargePoints.connectors'),
      width: 120,
      sortable: true,
      type: 'number'
    },
    {
      key: 'status',
      title: t('common.status'),
      width: 120,
      sortable: true,
      type: 'text'
    },
    {
      key: 'note',
      title: t('common.note'),
      sortable: false,
      type: 'text'
    },
    {
      key: 'created_at',
      title: t('common.created'),
      sortable: true,
      type: 'date'
    },
    {
      key: 'actions',
      title: t('common.actions'),
      width: 160,
      sortable: false,
      type: 'text',
      filterable: false
    }
  ]
})

// Computed properties
const filteredChargePoints = computed(() => {
  return chargePointsStore.allChargePoints
})

// Methods (formatDate now provided by useLocaleFormatting composable)

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'faulty':
      return 'error'
    default:
      return 'primary'
  }
}

const getSiteName = (siteId: number): string => {
  const site = sitesStore.getSiteById(siteId)
  return site?.name || `Site ${siteId}`
}

const openCreateDialog = (): void => {
  selectedChargePoint.value = null
  showFormDialog.value = true
}

const openEditDialog = (chargePoint: ChargePoint): void => {
  selectedChargePoint.value = chargePoint
  showFormDialog.value = true
}

const closeFormDialog = (): void => {
  selectedChargePoint.value = null
  showFormDialog.value = false
}

const openDetailDialog = (chargePoint: ChargePoint): void => {
  chargePointToView.value = chargePoint
  showDetailDialog.value = true
}

const closeDetailDialog = (): void => {
  chargePointToView.value = null
  showDetailDialog.value = false
}

const openDeleteDialog = (chargePoint: ChargePoint): void => {
  chargePointToDelete.value = chargePoint
  showDeleteDialog.value = true
}

const closeDeleteDialog = (): void => {
  chargePointToDelete.value = null
  showDeleteDialog.value = false
}

const handleFormSubmit = async (
  data: CreateChargePointRequest | UpdateChargePointRequest
): Promise<void> => {
  let success = false
  const isEdit = 'id' in data

  try {
    if (isEdit) {
      // Update existing charge point
      success = await chargePointsStore.updateChargePoint(data as UpdateChargePointRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('chargePoints.updated', { id: data.ocpp_charge_box_id }))
      }
    } else {
      // Create new charge point
      success = await chargePointsStore.createChargePoint(data as CreateChargePointRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('chargePoints.created', { id: data.ocpp_charge_box_id }))
      }
    }
  } catch (error) {
    console.error('Form submit error:', error)
    showErrorMessage(
      t(isEdit ? 'messages.updateError' : 'messages.createError', {
        item: t('chargePoints.chargePoint')
      })
    )
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!chargePointToDelete.value?.id) return

  try {
    const chargePointName = chargePointToDelete.value.ocpp_charge_box_id
    const success = await chargePointsStore.deleteChargePoint(chargePointToDelete.value.id)

    if (success) {
      closeDeleteDialog()
      showSuccessMessage(t('chargePoints.deleted', { id: chargePointName }))
    }
  } catch (error) {
    console.error('Delete error:', error)
    showErrorMessage(t('messages.deleteError', { item: t('chargePoints.chargePoint') }))
  }
}

// Export functions
const exportToPDF = async (): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = filteredChargePoints.value.map((cp) => ({
      ID: cp.id || '-',
      'OCPP ID': cp.ocpp_charge_box_id,
      Site: getSiteName(cp.site_id),
      Manufacturer: cp.manufacturer,
      Model: cp.model,
      Connectors: cp.connector_count,
      Status: t(`status.${cp.status?.toLowerCase()}`),
      Note: cp.note || '-',
      Created: cp.created_at ? formatDate(cp.created_at) : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    // Add title
    pdf.setFontSize(16)
    pdf.text('Charge Points Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Charge Points: ${exportData.length}`, 20, 35)

    // Create table content
    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 25, 25, 20, 20, 12, 15, 25, 20]
    const headers = [
      t('export.headers.id'),
      t('export.headers.ocppId'),
      t('export.headers.site'),
      t('export.headers.manufacturer'),
      t('export.headers.model'),
      t('export.headers.connectors'),
      t('export.headers.status'),
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
      if (yPos > 180) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 20
      Object.values(row).forEach((value, index) => {
        const text = String(value).substring(0, 20)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `chargepoints_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportToExcel = async (): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = filteredChargePoints.value.map((cp) => ({
      'Charge Point ID': cp.id || '',
      'OCPP Charge Box ID': cp.ocpp_charge_box_id,
      Site: getSiteName(cp.site_id),
      Manufacturer: cp.manufacturer,
      Model: cp.model,
      'Connector Count': cp.connector_count,
      Status: t(`status.${cp.status?.toLowerCase()}`),
      Note: cp.note || '',
      'Created Date': cp.created_at ? formatDate(cp.created_at) : ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 30 },
      { wch: 15 }
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'ChargePoints')

    wb.Props = {
      Title: 'Charge Points Export',
      Subject: 'OCPP Charge Points Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `chargepoints_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportToCSV = async (): Promise<void> => {
  try {
    const headers = [
      t('export.headers.chargePointId'),
      t('export.headers.ocppChargeBoxId'),
      t('export.headers.site'),
      t('export.headers.manufacturer'),
      t('export.headers.model'),
      t('export.headers.connectorCount'),
      t('export.headers.status'),
      t('export.headers.note'),
      t('export.headers.createdDate')
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    filteredChargePoints.value.forEach((cp) => {
      const statusTranslated = t('status.' + cp.status?.toLowerCase())
      const row = [
        `"${cp.id || ''}"`,
        `"${cp.ocpp_charge_box_id.replace(/"/g, '""')}"`,
        `"${getSiteName(cp.site_id).replace(/"/g, '""')}"`,
        `"${cp.manufacturer.replace(/"/g, '""')}"`,
        `"${cp.model.replace(/"/g, '""')}"`,
        `"${cp.connector_count}"`,
        `"${statusTranslated}"`,
        `"${(cp.note || '').replace(/"/g, '""')}"`,
        `"${cp.created_at ? formatDate(cp.created_at) : ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `chargepoints_export_${new Date().toISOString().split('T')[0]}.csv`
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
  setTimeout(() => {
    hideSuccessMessage()
  }, 5000)
}

const hideSuccessMessage = (): void => {
  showSuccessAlert.value = false
  successMessage.value = ''
}

const showErrorMessage = (message: string): void => {
  chargePointsStore.error = message
}

// Export methods for selected charge points
const exportSelectedToPDF = async (selectedChargePoints: ChargePoint[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = selectedChargePoints.map((cp) => ({
      'CP ID': cp.id || '-',
      'OCPP ID': cp.ocpp_charge_box_id,
      Site: getSiteName(cp.site_id),
      Manufacturer: cp.manufacturer,
      Model: cp.model,
      Connectors: cp.connector_count,
      Status: t(`status.${cp.status?.toLowerCase()}`),
      Note: cp.note || '-',
      Created: cp.created_at ? formatDate(cp.created_at) : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Selected Charge Points Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Selected Charge Points: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 25, 25, 20, 20, 12, 15, 25, 20]
    const headers = [
      t('export.headers.id'),
      t('export.headers.ocppId'),
      t('export.headers.site'),
      t('export.headers.manufacturer'),
      t('export.headers.model'),
      t('export.headers.connectors'),
      t('export.headers.status'),
      t('export.headers.note'),
      t('export.headers.created')
    ]

    pdf.setFontSize(8)
    pdf.setFont(undefined, 'bold')
    let xPos = 10
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPos)
      xPos += colWidths[index]
    })

    yPos += rowHeight
    pdf.setFont(undefined, 'normal')

    exportData.forEach((row) => {
      if (yPos > 180) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 10
      Object.values(row).forEach((value, index) => {
        const text = String(value).substring(0, 20)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `selected_chargepoints_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportSelectedToExcel = async (selectedChargePoints: ChargePoint[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = selectedChargePoints.map((cp) => ({
      'Charge Point ID': cp.id || '',
      'OCPP Charge Box ID': cp.ocpp_charge_box_id,
      Site: getSiteName(cp.site_id),
      Manufacturer: cp.manufacturer,
      Model: cp.model,
      'Connector Count': cp.connector_count,
      Status: t(`status.${cp.status?.toLowerCase()}`),
      Note: cp.note || '',
      'Created Date': cp.created_at ? formatDate(cp.created_at) : ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 }
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Selected Charge Points')

    wb.Props = {
      Title: 'Selected Charge Points Export',
      Subject: 'OCPP Selected Charge Points Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `selected_chargepoints_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportSelectedToCSV = async (selectedChargePoints: ChargePoint[]): Promise<void> => {
  try {
    const headers = [
      t('export.headers.chargePointId'),
      t('export.headers.ocppChargeBoxId'),
      t('export.headers.site'),
      t('export.headers.manufacturer'),
      t('export.headers.model'),
      t('export.headers.connectorCount'),
      t('export.headers.status'),
      t('export.headers.note'),
      t('export.headers.createdDate')
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    selectedChargePoints.forEach((cp) => {
      const row = [
        `"${cp.id || ''}"`,
        `"${cp.ocpp_charge_box_id.replace(/"/g, '""')}"`,
        `"${getSiteName(cp.site_id).replace(/"/g, '""')}"`,
        `"${cp.manufacturer.replace(/"/g, '""')}"`,
        `"${cp.model.replace(/"/g, '""')}"`,
        `"${cp.connector_count}"`,
        `"${t(`status.${cp.status?.toLowerCase()}`)}"`,
        `"${(cp.note || '').replace(/"/g, '""')}"`,
        `"${cp.created_at ? formatDate(cp.created_at) : ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `selected_chargepoints_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Advanced DataGrid event handlers
const handleFilteredExport = (format: string, items: ChargePoint[]) => {
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

const handleDeleteSelected = async (items: ChargePoint[]) => {
  if (items.length === 0) return

  try {
    let successCount = 0
    let failedCount = 0
    const failedItems: string[] = []

    for (const chargePoint of items) {
      try {
        if (chargePoint.id) {
          const success = await chargePointsStore.deleteChargePoint(chargePoint.id)
          if (success) {
            successCount++
          } else {
            failedCount++
            failedItems.push(chargePoint.ocpp_charge_box_id)
          }
        } else {
          failedCount++
          failedItems.push(chargePoint.ocpp_charge_box_id)
        }
      } catch (error) {
        console.error(`Failed to delete charge point ${chargePoint.ocpp_charge_box_id}:`, error)
        failedCount++
        failedItems.push(chargePoint.ocpp_charge_box_id)
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

// Selection event handlers
const handleSelectionChange = (newSelection: ChargePoint[]) => {
  console.log(`Selection changed: ${newSelection.length} items selected`)
}

const handleExportSelected = (format: 'pdf' | 'excel' | 'csv', items: ChargePoint[]) => {
  console.log(`Exporting ${items.length} selected charge points to ${format}`)

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

const handleRowClick = (item: ChargePoint) => {
  console.log('Row clicked:', item)
  // openDetailDialog(item)
}

// Export methods for filtered charge points
const exportFilteredToPDF = async (filteredChargePoints: ChargePoint[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = filteredChargePoints.map((cp) => ({
      'CP ID': cp.id || '-',
      'OCPP ID': cp.ocpp_charge_box_id,
      Site: getSiteName(cp.site_id),
      Manufacturer: cp.manufacturer,
      Model: cp.model,
      Connectors: cp.connector_count,
      Status: t(`status.${cp.status?.toLowerCase()}`),
      Note: cp.note || '-',
      Created: cp.created_at ? formatDate(cp.created_at) : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Filtered Charge Points Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Filtered Charge Points: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 25, 25, 20, 20, 12, 15, 25, 20]
    const headers = [
      t('export.headers.id'),
      t('export.headers.ocppId'),
      t('export.headers.site'),
      t('export.headers.manufacturer'),
      t('export.headers.model'),
      t('export.headers.connectors'),
      t('export.headers.status'),
      t('export.headers.note'),
      t('export.headers.created')
    ]

    pdf.setFontSize(8)
    pdf.setFont(undefined, 'bold')
    let xPos = 10
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPos)
      xPos += colWidths[index]
    })

    yPos += rowHeight
    pdf.setFont(undefined, 'normal')

    exportData.forEach((row) => {
      if (yPos > 180) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 10
      Object.values(row).forEach((value, index) => {
        const text = String(value).substring(0, 20)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `filtered_chargepoints_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportFilteredToExcel = async (filteredChargePoints: ChargePoint[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = filteredChargePoints.map((cp) => ({
      'Charge Point ID': cp.id || '',
      'OCPP Charge Box ID': cp.ocpp_charge_box_id,
      Site: getSiteName(cp.site_id),
      Manufacturer: cp.manufacturer,
      Model: cp.model,
      'Connector Count': cp.connector_count,
      Status: t(`status.${cp.status?.toLowerCase()}`),
      Note: cp.note || '',
      'Created Date': cp.created_at ? formatDate(cp.created_at) : ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 }
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Charge Points')

    wb.Props = {
      Title: 'Filtered Charge Points Export',
      Subject: 'OCPP Filtered Charge Points Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `filtered_chargepoints_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportFilteredToCSV = async (filteredChargePoints: ChargePoint[]): Promise<void> => {
  try {
    const headers = [
      t('export.headers.chargePointId'),
      t('export.headers.ocppChargeBoxId'),
      t('export.headers.site'),
      t('export.headers.manufacturer'),
      t('export.headers.model'),
      t('export.headers.connectorCount'),
      t('export.headers.status'),
      t('export.headers.note'),
      t('export.headers.createdDate')
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    filteredChargePoints.forEach((cp) => {
      const row = [
        `"${cp.id || ''}"`,
        `"${cp.ocpp_charge_box_id.replace(/"/g, '""')}"`,
        `"${getSiteName(cp.site_id).replace(/"/g, '""')}"`,
        `"${cp.manufacturer.replace(/"/g, '""')}"`,
        `"${cp.model.replace(/"/g, '""')}"`,
        `"${cp.connector_count}"`,
        `"${t(`status.${cp.status?.toLowerCase()}`)}"`,
        `"${(cp.note || '').replace(/"/g, '""')}"`,
        `"${cp.created_at ? formatDate(cp.created_at) : ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const FileSaver = await import('file-saver')

    const filename = `filtered_chargepoints_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Load both charge points and sites
    await Promise.all([
      chargePointsStore.fetchChargePoints(),
      sitesStore.sites.length === 0 ? sitesStore.fetchSites() : Promise.resolve()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
    showErrorMessage(t('messages.loadError', { item: t('chargePoints.title') }))
  }
})
</script>

<style scoped>
.chargepoints-container {
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

.chargepoints-table {
  background: transparent;
}

.site-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-icon {
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
}

.delete-dialog .delete-title {
  color: rgb(var(--v-theme-error));
  font-weight: 600;
}

.chargepoint-detail-dialog .detail-title {
  color: rgb(var(--v-theme-info));
  font-weight: 600;
  padding: 20px 24px 16px;
}

.chargepoint-detail-dialog .label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.chargepoint-detail-dialog .value {
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 4px;
}

.chargepoint-detail-dialog .note-title {
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.chargepoint-detail-dialog .note-content {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.5;
  margin: 0;
}

.chargepoint-detail-dialog .detail-actions {
  padding: 16px 24px 24px;
}

.export-actions {
  width: 100%;
}

@media (max-width: 960px) {
  .chargepoints-container {
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
}
</style>
