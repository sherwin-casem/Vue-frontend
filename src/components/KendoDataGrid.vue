<template>
  <div class="kendo-data-grid-container">


    <!-- Kendo UI Grid -->
    <Grid
      ref="kendoGrid"
      :data-items="gridDataItems"
      :columns="gridColumns"
      :sortable="true"

      :groupable="true"
      :reorderable="true"
      :resizable="true"
      
      :pageable="pageableConfig"
      :toolbar="toolbarConfig"
      :columnMenu="columnMenuConfig"
      @datastatechange="onDataStateChange"
      
      @rowclick="onRowClick"
      class="kendo-grid"
    >
      <template v-for="(_, slot) in customSlots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </Grid>



    <!-- Progress Indicator -->
    <v-overlay :model-value="loading" class="align-center justify-center">
      <div class="text-center">
        <v-progress-circular indeterminate size="64" color="primary" />
        <div class="mt-4 text-h6">{{ loadingMessage }}</div>
      </div>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid } from '@progress/kendo-vue-grid'
import { process, DataSourceRequestState } from '@progress/kendo-data-query'

interface Props {
  items: any[]
  columns: GridColumn[]
  loading?: boolean
  exportEnabled?: boolean
  deleteEnabled?: boolean
  customSlots?: string[]
}

interface GridColumn {
  field: string
  title: string
  width?: number | string
  sortable?: boolean
  hidden?: boolean
  type?: 'text' | 'number' | 'date' | 'boolean'
  format?: string
  template?: string
}

interface Emits {
  (e: 'export-filtered', format: string, items: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  exportEnabled: true,
  deleteEnabled: true,
  customSlots: () => []
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Refs
const kendoGrid = ref()
const loadingMessage = ref('')

// Data state management
const dataState = ref<DataSourceRequestState>({
  skip: 0,
  take: 20,
  sort: [],
  group: []
})

// Computed properties
const filteredItems = computed(() => {
  return props.items
})

const gridDataItems = computed(() => {
  return {
    data: props.items,
    total: props.items.length
  }
})

const gridColumns = computed(() => {
  const baseColumns = props.columns.map((col) => ({
    field: col.field,
    title: col.title,
    width: col.width,
    sortable: col.sortable !== false,
    hidden: col.hidden || false,
    format: col.format,
    template: col.template
  }))



  return baseColumns
})

const pageableConfig = computed(() => ({
  buttonCount: 5,
  info: true,
  type: 'numeric',
  pageSizes: [10, 20, 50, 100],
  previousNext: true
}))

const toolbarConfig = computed(() => {
  const toolbar = []

  if (props.exportEnabled) {
    toolbar.push('excel', 'pdf')
  }

  return toolbar
})

const columnMenuConfig = computed(() => ({
  sortable: true,
  columnChooser: true
}))



// Methods
const onDataStateChange = (event: any) => {
  dataState.value = event.data
}



const onRowClick = (event: any) => {
  // Handle row click if needed
}

const getItemKey = (item: any): string => {
  return (
    item.id ??
    item.site_id ??
    item.charge_point_id ??
    item.profile_id ??
    item.connector_id ??
    item.period_id ??
    Math.random().toString()
  )
}



const exportFiltered = (format: string) => {
  emit('export-filtered', format, filteredItems.value)
}

// Export functionality using file-saver and custom logic
const exportToPDF = async () => {
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('l', 'mm', 'a4')

    // Add title
    pdf.setFontSize(16)
    pdf.text('Data Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Items: ${filteredItems.value.length}`, 20, 35)

    // Create table content
    let yPos = 50
    const rowHeight = 8
    const headers = props.columns.map((col) => col.title)

    // Draw headers
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'bold')
    let xPos = 20
    headers.forEach((header, index) => {
      pdf.text(header, xPos, yPos)
      xPos += 40 // Adjust column width as needed
    })

    yPos += rowHeight
    pdf.setFont(undefined, 'normal')

    // Draw data rows
    filteredItems.value.forEach((item) => {
      if (yPos > 180) {
        pdf.addPage()
        yPos = 20
      }

      xPos = 20
      props.columns.forEach((col, index) => {
        const value = String(item[col.field] || '').substring(0, 15)
        pdf.text(value, xPos, yPos)
        xPos += 40
      })

      yPos += rowHeight
    })

    const filename = `export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const XLSX = await import('xlsx')
    const exportData = filteredItems.value.map((item) => {
      const row: any = {}
      props.columns.forEach((col) => {
        row[col.title] = item[col.field] || ''
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = props.columns.map(() => ({ wch: 20 }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    wb.Props = {
      Title: 'Data Export',
      Subject: 'Exported Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCSV = async () => {
  try {
    const headers = props.columns.map((col) => col.title).join(',')
    const rows = filteredItems.value.map((item) =>
      props.columns.map((col) => `"${item[col.field] || ''}"`).join(',')
    )

    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const FileSaver = await import('file-saver')
    FileSaver.saveAs(blob, `export_${new Date().toISOString().split('T')[0]}.csv`)
  } catch (error) {
    console.error('CSV export error:', error)
  }
}

// Expose methods for parent components
defineExpose({
  exportToPDF,
  exportToExcel,
  exportToCSV
})

onMounted(() => {
  // Initialize grid state
  if (kendoGrid.value) {
    // Additional grid setup if needed
  }
})
</script>

<style scoped>
.kendo-data-grid-container {
  position: relative;
  width: 100%;
}

.batch-selection-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 400px;
  max-width: 90vw;
  pointer-events: auto;
}

.toolbar-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(10px);
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px !important;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.selection-icon {
  font-size: 24px;
}

.selection-count {
  font-weight: 600;
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-action-btn {
  transition: all 0.2s ease;
  border-radius: 8px;
}

.toolbar-action-btn:hover {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

.delete-btn:hover {
  background: rgb(var(--v-theme-error)) !important;
  color: rgb(var(--v-theme-on-error)) !important;
}

.export-menu {
  border-radius: 12px;
  overflow: hidden;
}

.export-item {
  transition: background-color 0.2s ease;
}

.export-item:hover {
  background: rgb(var(--v-theme-primary-container));
}



.kendo-grid {
  width: 100%;
  height: 600px;
}

/* Kendo UI Grid Customizations */
:deep(.k-grid) {
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

:deep(.k-grid-header) {
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 2px solid rgb(var(--v-theme-primary));
}

:deep(.k-grid-header th) {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  padding: 12px 16px;
}

:deep(.k-grid-content) {
  background: rgb(var(--v-theme-surface));
}

:deep(.k-grid-content td) {
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

:deep(.k-alt) {
  background: rgba(var(--v-theme-primary), 0.05);
}

:deep(.k-selected) {


}

:deep(.k-grid-toolbar) {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  padding: 12px 16px;
}

:deep(.k-button) {
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.k-button:hover) {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}


</style>
