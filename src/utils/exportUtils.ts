export interface ExportColumn {
  key: string
  title: string
  type?: 'text' | 'number' | 'date' | 'boolean'
}

export interface ExportOptions {
  filename?: string
  title?: string
  columns: ExportColumn[]
  data: any[]
}

export class ExportUtils {
  static async exportToPDF(options: ExportOptions): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf')

      const pdf = new jsPDF('l', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      const title = options.title || 'Data Export'
      pdf.text(title, 20, 20)

      // Metadata
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
      pdf.text(`Total Records: ${options.data.length}`, 20, 35)

      // Calculate column widths
      const availableWidth = pageWidth - 40
      const columnWidth = availableWidth / options.columns.length

      let yPos = 50
      const rowHeight = 8

      // Headers
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      let xPos = 20

      options.columns.forEach((column) => {
        pdf.text(column.title, xPos, yPos)
        xPos += columnWidth
      })

      yPos += rowHeight
      pdf.setFont('helvetica', 'normal')

      // Data rows
      options.data.forEach((row) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage()
          yPos = 20
        }

        xPos = 20
        options.columns.forEach((column) => {
          const value = row[column.key]
          let displayValue = ''

          if (value !== null && value !== undefined) {
            if (column.type === 'date' && value) {
              displayValue = new Date(value).toLocaleDateString()
            } else if (column.type === 'boolean') {
              displayValue = value ? 'Yes' : 'No'
            } else {
              displayValue = String(value)
            }
          }

          // Truncate long text
          if (displayValue.length > 20) {
            displayValue = displayValue.substring(0, 17) + '...'
          }

          pdf.text(displayValue, xPos, yPos)
          xPos += columnWidth
        })

        yPos += rowHeight
      })

      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(filename)
    } catch (error) {
      console.error('PDF export error:', error)
      throw new Error('Failed to export PDF')
    }
  }

  static async exportToExcel(options: ExportOptions): Promise<void> {
    try {
      const XLSX = await import('xlsx')

      // Prepare data with column headers
      const exportData = options.data.map((row) => {
        const formattedRow: any = {}
        options.columns.forEach((column) => {
          const value = row[column.key]
          let displayValue = value

          if (column.type === 'date' && value) {
            displayValue = new Date(value).toLocaleDateString()
          } else if (column.type === 'boolean') {
            displayValue = value ? 'Yes' : 'No'
          }

          formattedRow[column.title] = displayValue || ''
        })
        return formattedRow
      })

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()

      // Set column widths
      const colWidths = options.columns.map(() => ({ wch: 20 }))
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Data')

      // Set workbook properties
      wb.Props = {
        Title: options.title || 'Data Export',
        Subject: 'Exported Data',
        Author: 'OCPP Frontend',
        CreatedDate: new Date()
      }

      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Excel export error:', error)
      throw new Error('Failed to export Excel')
    }
  }

  static async exportToCSV(options: ExportOptions): Promise<void> {
    try {
      // Create CSV headers
      const headers = options.columns.map((col) => col.title)
      const csvRows = [headers.join(',')]

      // Add data rows
      options.data.forEach((row) => {
        const csvRow = options.columns.map((column) => {
          const value = row[column.key]
          let displayValue = ''

          if (value !== null && value !== undefined) {
            if (column.type === 'date' && value) {
              displayValue = new Date(value).toLocaleDateString()
            } else if (column.type === 'boolean') {
              displayValue = value ? 'Yes' : 'No'
            } else {
              displayValue = String(value)
            }
          }

          // Escape quotes and wrap in quotes
          return `"${displayValue.replace(/"/g, '""')}"`
        })

        csvRows.push(csvRow.join(','))
      })

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = options.filename || `export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('CSV export error:', error)
      throw new Error('Failed to export CSV')
    }
  }
}

// Convenience functions for specific data types
export const exportToExcelFile = async (data: any[], type: string) => {
  const columns = getSiteColumns()
  await ExportUtils.exportToExcel({
    data,
    columns,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Export`,
    filename: `${type}_${new Date().toISOString().split('T')[0]}.xlsx`
  })
}

export const exportToPdfFile = async (data: any[], type: string, columns?: any[]) => {
  const exportColumns: ExportColumn[] = columns
    ? columns.map((col) => ({
        key: col.field,
        title: col.title,
        type: (col.field.includes('_at') ? 'date' : 'text') as
          | 'text'
          | 'number'
          | 'date'
          | 'boolean'
      }))
    : getSiteColumns()

  await ExportUtils.exportToPDF({
    data,
    columns: exportColumns,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Export`,
    filename: `${type}_${new Date().toISOString().split('T')[0]}.pdf`
  })
}

function getSiteColumns(): ExportColumn[] {
  return [
    { key: 'site_id', title: 'Site ID', type: 'number' },
    { key: 'name', title: 'Site Name', type: 'text' },
    { key: 'address', title: 'Address', type: 'text' },
    { key: 'postal_code', title: 'Postal Code', type: 'text' },
    { key: 'city', title: 'City', type: 'text' },
    { key: 'country', title: 'Country', type: 'text' },
    { key: 'note', title: 'Note', type: 'text' },
    { key: 'created_at', title: 'Created', type: 'date' },
    { key: 'updated_at', title: 'Updated', type: 'date' }
  ]
}



export function capitalizeFirst(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

capitalizeFirst("hello world");