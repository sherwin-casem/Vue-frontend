<template>
  <div class="connectors-container">
    <!-- Success Alert -->
    <v-alert
      v-if="showSuccessAlert"
      type="success"
      class="success-alert"
      closable
      @click:close="hideSuccessMessage"
    >
      {{ successMessage }}
    </v-alert>

    <!-- Error Alert -->
    <v-alert
      v-if="connectorsStore.error"
      type="error"
      class="error-alert"
      closable
      @click:close="connectorsStore.clearError()"
    >
      {{ connectorsStore.error }}
    </v-alert>

    <!-- Header -->
    <div class="header-section">
      <h1 class="page-title">{{ $t('connectors.title') }}</h1>
      <div class="header-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="create-btn">
          {{ $t('connectors.addConnector') }}
        </v-btn>
      </div>
    </div>

    <!-- Data Grid -->
    <v-card class="data-grid-card" elevation="2">
      <EnhancedDataGrid
        :columns="advancedHeaders"
        :items="filteredConnectors"
        :loading="connectorsStore.loading"
        :table-key="'connectors'"
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

        <!-- Charge Point column -->
        <template v-slot:item.charge_point_id="{ item }">
          <div class="charge-point-cell">
            <v-icon class="charge-point-icon" size="small">mdi-ev-station</v-icon>
            {{ getChargePointName(item.charge_point_id) }}
          </div>
        </template>

        <!-- Power column -->
        <template v-slot:item.max_power_kw="{ item }">{{
          formatPower(item.max_power_kw, 'kW')
        }}</template>

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
      <ConnectorForm
        :connector="selectedConnector"
        :loading="connectorsStore.loading"
        @submit="handleFormSubmit"
        @cancel="closeFormDialog"
      />
    </v-dialog>

    <!-- Connector Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="600px">
      <v-card class="connector-detail-dialog">
        <v-card-title class="detail-title">
          <v-icon color="info" start>mdi-information</v-icon>
          {{ $t('connectors.connectorDetails') }}
        </v-card-title>

        <v-card-text>
          <v-container v-if="connectorToView">
            <v-row>
              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('connectors.connectorId') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      connectorToView.id || 'N/A'
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('connectors.connectorNumber') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      connectorToView.connector_number
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('connectors.chargePoint') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      getChargePointName(connectorToView.charge_point_id)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('connectors.type') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      connectorToView.type
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('connectors.maxPower') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value"
                      >{{ connectorToView.max_power_kw }} kW</v-list-item-subtitle
                    >
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label">{{ $t('common.status') }}:</v-list-item-title>
                    <v-list-item-subtitle class="value">
                      <v-chip
                        :color="getStatusColor(connectorToView.status)"
                        size="small"
                        variant="tonal"
                      >
                        {{ $t(`status.${connectorToView.status?.toLowerCase()}`) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
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
            variant="flat"
            class="pl-4 pr-4"
            v-if="connectorToView"
            @click="() => {
              openEditDialog(connectorToView!)
              closeDetailDialog()
            }"
          >
            <v-icon start>mdi-pencil</v-icon>
            {{ $t('connectors.editConnector') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card class="delete-dialog">
        <v-card-title class="delete-title">
          <v-icon color="error" start>mdi-delete</v-icon>
          {{ $t('connectors.deleteConnector') }}
        </v-card-title>

        <v-card-text>
          {{ $t('connectors.confirmDelete', { number: connectorToDelete?.connector_number }) }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog" :disabled="connectorsStore.loading">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="connectorsStore.loading"
          >
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
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { useConnectorsStore } from '@/stores/connectors'
import { useChargePointsStore } from '@/stores/chargepoints'
import EnhancedDataGrid from '@/components/EnhancedDataGrid.vue'
import ConnectorForm from '@/components/ConnectorForm.vue'
import type {
  Connector,
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorFilters
} from '@/types/connectors'

const connectorsStore = useConnectorsStore()
const chargePointsStore = useChargePointsStore()
const { t, locale } = useI18n()
const { formatPower, formatNumber } = useLocaleFormatting()

// Reactive state
const selectedConnector = ref<Connector | null>(null)
const connectorToDelete = ref<Connector | null>(null)
const connectorToView = ref<Connector | null>(null)
const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)
const successMessage = ref('')
const showSuccessAlert = ref(false)
const batchToolbarRef = ref()
const batchDeleteLoading = ref(false)
const batchDeleteProgress = ref(0)
const currentDeleteIndex = ref(0)

// Filters
const filters = reactive<ConnectorFilters>({
  search: '',
  status: '',
  type: '',
  charge_point_id: undefined
})

// Table headers
const headers = computed(() => [
  { title: t('connectors.connectorId'), key: 'id', sortable: true, width: '80px' },
  { title: t('connectors.chargePoint'), key: 'charge_point_id', sortable: true },
  {
    title: t('connectors.connectorNumber'),
    key: 'connector_number',
    sortable: true,
    width: '100px'
  },
  { title: t('connectors.type'), key: 'type', sortable: true },
  { title: t('connectors.maxPower'), key: 'max_power_kw', sortable: true, width: '120px' },
  { title: t('common.status'), key: 'status', sortable: true, width: '120px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '160px' }
])

// Force reactivity key for translations
const translationKey = ref(0)

// Watch for locale changes to force header re-computation
watch(locale, () => {
  translationKey.value++
})

// Advanced DataGrid headers configuration
const advancedHeaders = computed(() => {
  // Access translationKey to force reactivity
  translationKey.value
  return [
    {
      key: 'id',
      title: t('connectors.connectorId'),
      width: 80,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'charge_point_id',
      title: t('connectors.chargePoint'),

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'connector_number',
      title: t('connectors.connectorNumber'),
      width: 100,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'type',
      title: t('connectors.type'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'max_power_kw',
      title: t('connectors.maxPower'),
      width: 120,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'status',
      title: t('common.status'),
      width: 120,

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'actions',
      title: t('common.actions'),
      width: 160,
      sortable: false,
      type: 'text' as const,
      filterable: false
    }
  ]
})

// Computed properties
const filteredConnectors = computed(() => {
  const cleanFilters = {
    search: filters.search || '',
    status: filters.status === 'All' ? '' : filters.status,
    type: filters.type === 'All' ? '' : filters.type,
    charge_point_id: filters.charge_point_id
  }
  return connectorsStore.filteredConnectors(cleanFilters)
})

// Methods
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'success'
    case 'faulted':
      return 'error'
    default:
      return 'primary'
  }
}

const getChargePointName = (chargePointId: number): string => {
  const chargePoint = chargePointsStore.getChargePointById(chargePointId)
  return chargePoint?.ocpp_charge_box_id || `CP ${chargePointId}`
}

const openCreateDialog = (): void => {
  selectedConnector.value = null
  showFormDialog.value = true
}

const openEditDialog = (connector: Connector): void => {
  selectedConnector.value = connector
  showFormDialog.value = true
}

const closeFormDialog = (): void => {
  selectedConnector.value = null
  showFormDialog.value = false
}

const openDetailDialog = (connector: Connector): void => {
  connectorToView.value = connector
  showDetailDialog.value = true
}

const closeDetailDialog = (): void => {
  connectorToView.value = null
  showDetailDialog.value = false
}

const openDeleteDialog = (connector: Connector): void => {
  connectorToDelete.value = connector
  showDeleteDialog.value = true
}

const closeDeleteDialog = (): void => {
  connectorToDelete.value = null
  showDeleteDialog.value = false
}

const handleFormSubmit = async (
  data: CreateConnectorRequest | UpdateConnectorRequest
): Promise<void> => {
  let success = false
  const isEdit = 'id' in data

  try {
    if (isEdit) {
      success = await connectorsStore.updateConnector(data as UpdateConnectorRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('connectors.updated', { number: data.connector_number }))
      }
    } else {
      success = await connectorsStore.createConnector(data as CreateConnectorRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('connectors.created', { number: data.connector_number }))
      }
    }
  } catch (error) {
    console.error('Form submit error:', error)
    showErrorMessage(
      t(isEdit ? 'messages.updateError' : 'messages.createError', {
        item: t('connectors.connector')
      })
    )
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!connectorToDelete.value?.id) return

  try {
    const connectorNumber = connectorToDelete.value.connector_number
    const success = await connectorsStore.deleteConnector(connectorToDelete.value.id)

    if (success) {
      closeDeleteDialog()
      showSuccessMessage(t('connectors.deleted', { number: connectorNumber }))
    }
  } catch (error) {
    console.error('Delete error:', error)
    showErrorMessage(t('messages.deleteError', { item: t('connectors.connector') }))
  }
}

// Export functions
const exportToPDF = async (): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = filteredConnectors.value.map((connector) => ({
      ID: connector.id || '-',
      'Charge Point': getChargePointName(connector.charge_point_id),
      'Connector Number': connector.connector_number,
      Type: connector.type,
      'Max Power': `${connector.max_power_kw} kW`,
      Status: t(`status.${connector.status?.toLowerCase()}`)
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Connectors Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Connectors: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 35, 20, 25, 20, 20]
    const headers = ['ID', 'Charge Point', 'Number', 'Type', 'Max Power', 'Status']

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

    const filename = `connectors_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportToExcel = async (): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = filteredConnectors.value.map((connector) => ({
      'Connector ID': connector.id || '',
      'Charge Point': getChargePointName(connector.charge_point_id),
      'Connector Number': connector.connector_number,
      Type: connector.type,
      'Max Power (kW)': connector.max_power_kw,
      Status: t(`status.${connector.status?.toLowerCase()}`)
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Connectors')

    wb.Props = {
      Title: 'Connectors Export',
      Subject: 'OCPP Connectors Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `connectors_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportToCSV = async (): Promise<void> => {
  try {
    const headers = [
      'Connector ID',
      'Charge Point',
      'Connector Number',
      'Type',
      'Max Power (kW)',
      'Status'
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    filteredConnectors.value.forEach((connector) => {
      const row = [
        `"${connector.id || ''}"`,
        `"${getChargePointName(connector.charge_point_id).replace(/"/g, '""')}"`,
        `"${connector.connector_number}"`,
        `"${connector.type.replace(/"/g, '""')}"`,
        `"${connector.max_power_kw}"`,
        `"${t(`status.${connector.status?.toLowerCase()}`)}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `connectors_export_${new Date().toISOString().split('T')[0]}.csv`
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
  connectorsStore.error = message
}

const exportSelectedToPDF = async (selectedConnectors: Connector[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = selectedConnectors.map((connector) => ({
      ID: connector.id || '-',
      'Charge Point': getChargePointName(connector.charge_point_id),
      Number: connector.connector_number,
      Type: connector.type,
      'Max Power': `${connector.max_power_kw} kW`,
      Status: t(`status.${connector.status?.toLowerCase()}`)
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Selected Connectors Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Selected Connectors: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 35, 20, 25, 20, 20]
    const headers = ['ID', 'Charge Point', 'Number', 'Type', 'Max Power', 'Status']

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

    const filename = `selected_connectors_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportSelectedToExcel = async (selectedConnectors: Connector[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = selectedConnectors.map((connector) => ({
      'Connector ID': connector.id || '',
      'Charge Point': getChargePointName(connector.charge_point_id),
      'Connector Number': connector.connector_number,
      Type: connector.type,
      'Max Power (kW)': connector.max_power_kw,
      Status: t(`status.${connector.status?.toLowerCase()}`)
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Selected Connectors')

    wb.Props = {
      Title: 'Selected Connectors Export',
      Subject: 'OCPP Selected Connectors Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `selected_connectors_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportSelectedToCSV = async (selectedConnectors: Connector[]): Promise<void> => {
  try {
    const headers = [
      'Connector ID',
      'Charge Point',
      'Connector Number',
      'Type',
      'Max Power (kW)',
      'Status'
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    selectedConnectors.forEach((connector) => {
      const row = [
        `"${connector.id || ''}"`,
        `"${getChargePointName(connector.charge_point_id).replace(/"/g, '""')}"`,
        `"${connector.connector_number}"`,
        `"${connector.type.replace(/"/g, '""')}"`,
        `"${connector.max_power_kw}"`,
        `"${t(`status.${connector.status?.toLowerCase()}`)}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `selected_connectors_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Advanced DataGrid event handlers
const handleFilteredExport = (format: string, items: Connector[]) => {
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
const handleSelectionChange = (newSelection: Connector[]) => {
  console.log(`Selection changed: ${newSelection.length} items selected`)
}

const handleDeleteSelected = async (items: Connector[]) => {
  if (items.length === 0) return

  try {
    let successCount = 0
    let failedCount = 0
    const failedItems: string[] = []

    for (const connector of items) {
      try {
        if (connector.id) {
          const success = await connectorsStore.deleteConnector(connector.id)
          if (success) {
            successCount++
          } else {
            failedCount++
            failedItems.push(`Connector ${connector.connector_number}`)
          }
        } else {
          failedCount++
          failedItems.push(`Connector ${connector.connector_number}`)
        }
      } catch (error) {
        console.error(`Failed to delete connector ${connector.id}:`, error)
        failedCount++
        failedItems.push(`Connector ${connector.connector_number}`)
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

const handleExportSelected = (format: 'pdf' | 'excel' | 'csv', items: Connector[]) => {
  console.log(`Exporting ${items.length} selected connectors to ${format}`)

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

const handleRowClick = (item: Connector) => {
  // Optional: Handle row click - could open detail dialog
  console.log('Row clicked:', item)
}

// Export methods for filtered connectors (similar to selected ones but for filtered data)
const exportFilteredToPDF = async (filteredConnectors: Connector[]): Promise<void> => {
  // Implementation similar to exportSelectedToPDF but for filtered data
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Filtered Connectors Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Items: ${filteredConnectors.length}`, 20, 35)

    const filename = `filtered_connectors_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportFilteredToExcel = async (filteredConnectors: Connector[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')
    const exportData = filteredConnectors.map((connector) => ({
      'Connector ID': connector.id || '',
      'Charge Point': getChargePointName(connector.charge_point_id),
      'Connector Number': connector.connector_number,
      Type: connector.type,
      'Max Power (kW)': connector.max_power_kw,
      Status: t(`status.${connector.status?.toLowerCase()}`)
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Connectors')

    const filename = `filtered_connectors_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportFilteredToCSV = async (filteredConnectors: Connector[]): Promise<void> => {
  try {
    const headers = [
      'Connector ID',
      'Charge Point',
      'Connector Number',
      'Type',
      'Max Power (kW)',
      'Status'
    ]
    const csvRows = [headers.join(',')]

    filteredConnectors.forEach((connector) => {
      const row = [
        `"${connector.id || ''}"`,
        `"${getChargePointName(connector.charge_point_id).replace(/"/g, '""')}"`,
        `"${connector.connector_number}"`,
        `"${connector.type.replace(/"/g, '""')}"`,
        `"${connector.max_power_kw}"`,
        `"${t(`status.${connector.status?.toLowerCase()}`)}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const FileSaver = await import('file-saver')

    const filename = `filtered_connectors_export_${new Date().toISOString().split('T')[0]}.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      connectorsStore.fetchConnectors(),
      chargePointsStore.chargePoints.length === 0
        ? chargePointsStore.fetchChargePoints()
        : Promise.resolve()
    ])
  } catch (error) {
    console.error('Failed to load connectors data:', error)
  }
})
</script>

<style scoped>
.connectors-container {
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

.charge-point-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.charge-point-icon {
  color: rgb(var(--v-theme-primary));
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.export-actions {
  width: 100%;
}

.placeholder-form {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

@media (max-width: 960px) {
  .connectors-container {
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
