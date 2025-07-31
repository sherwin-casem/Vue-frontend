<template>
  <div class="schedule-periods-container">
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
      v-if="schedulePeriodsStore.error"
      type="error"
      class="error-alert"
      closable
      @click:close="schedulePeriodsStore.clearError()"
    >
      {{ schedulePeriodsStore.error }}
    </v-alert>

    <!-- Header -->
    <div class="header-section">
      <h1 class="page-title">{{ $t('schedulePeriods.title') }}</h1>
      <div class="header-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="create-btn">
          {{ $t('schedulePeriods.addSchedulePeriod') }}
        </v-btn>
      </div>
    </div>

    <!-- Profile Filter (if from charging profiles page) -->
    <v-card v-if="selectedProfileId" class="profile-filter-card mb-4" elevation="2">
      <v-card-text>
        <div class="profile-filter">
          <v-icon color="info" start>mdi-filter</v-icon>
          <span class="filter-text">
            {{ $t('schedulePeriods.filteringByProfile') }}:
            <strong>{{ getProfileName(selectedProfileId) }}</strong>
          </span>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="clearProfileFilter"
            class="ml-2"
          >
            {{ $t('common.clearFilter') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Filters Card -->
    <v-card class="filters-card" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.charging_profile_id"
              :label="$t('schedulePeriods.chargingProfile')"
              :items="profileFilterOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @click:clear="filters.charging_profile_id = undefined"
            />
          </v-col>

          <v-col cols="12" sm="2">
            <v-select
              v-model="filters.number_phases"
              :label="$t('schedulePeriods.phases')"
              :items="phaseFilterOptions"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @click:clear="filters.number_phases = undefined"
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-btn
              color="info"
              variant="outlined"
              prepend-icon="mdi-chart-timeline-variant"
              @click="navigateToChargingProfiles"
              block
            >
              {{ $t('schedulePeriods.manageProfiles') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Grid -->
    <v-card class="data-grid-card" elevation="2">
      <EnhancedDataGrid
        :columns="advancedHeaders"
        :items="filteredSchedulePeriods"
        :loading="schedulePeriodsStore.loading"
        :table-key="'schedule-periods'"
        :enable-selection="true"
        :selection-loading="selectionLoading"
        :delete-loading="deleteLoading"
        :delete-progress="deleteProgress"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        @export-selected="handleExportSelected"
        @delete-selected="handleDeleteSelected"
      >
        <!-- Charging Profile column -->
        <template v-slot:item.charging_profile_id="{ item }">
          <div class="charging-profile-cell">
            <v-icon class="profile-icon" size="small">mdi-chart-timeline-variant</v-icon>
            <div class="profile-info">
              <div class="profile-name">{{ getProfileName(item.charging_profile_id) }}</div>
              <div class="profile-details">
                <v-chip
                  size="x-small"
                  :color="getProfilePurposeColor(item.charging_profile_id)"
                  variant="tonal"
                >
                  {{ getProfilePurpose(item.charging_profile_id) }}
                </v-chip>
              </div>
            </div>
          </div>
        </template>

        <!-- Start Period column with time formatting -->
        <template v-slot:item.start_period_in_seconds="{ item }">
          <div class="start-period-cell">
            <div class="time-display">{{ formatSeconds(item.start_period_in_seconds) }}</div>
            <div class="seconds-display">{{ item.start_period_in_seconds }}s</div>
          </div>
        </template>

        <!-- Power Limit column -->
        <template v-slot:item.limit="{ item }">
          <div class="limit-cell">
            <v-chip :color="getLimitColor(item.limit)" size="small" variant="outlined">
              {{ item.limit }} kW
            </v-chip>
          </div>
        </template>

        <!-- Number of Phases column -->
        <template v-slot:item.number_phases="{ item }">
          <div class="phases-cell">
            <v-badge :color="getPhaseColor(item.number_phases)" :content="item.number_phases">
              <v-icon size="small">mdi-sine-wave</v-icon>
            </v-badge>
            <span class="ml-2">{{ $t('schedulePeriods.phase', item.number_phases) }}</span>
          </div>
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
      <SchedulePeriodForm
        :schedule-period="selectedSchedulePeriod"
        :preselected-profile-id="selectedProfileId"
        :loading="schedulePeriodsStore.loading"
        @submit="handleFormSubmit"
        @cancel="closeFormDialog"
      />
    </v-dialog>

    <!-- Schedule Period Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="600px">
      <v-card class="schedule-period-detail-dialog">
        <v-card-title class="detail-title">
          <v-icon color="info" start>mdi-information</v-icon>
          {{ $t('schedulePeriods.schedulePeriodDetails') }}
        </v-card-title>

        <v-card-text>
          <v-container v-if="periodToView">
            <v-row>
              <v-col cols="12">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('schedulePeriods.schedulePeriodId') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      periodToView.id || 'N/A'
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('schedulePeriods.chargingProfile') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      getProfileName(periodToView.charging_profile_id)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('schedulePeriods.startPeriod') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">
                      {{ formatSeconds(periodToView.start_period_in_seconds) }} ({{
                        periodToView.start_period_in_seconds
                      }}
                      seconds)
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('schedulePeriods.limit') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">
                      <v-chip
                        :color="getLimitColor(periodToView.limit)"
                        size="small"
                        variant="outlined"
                      >
                        {{ periodToView.limit }} kW
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('schedulePeriods.numberPhases') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">
                      <v-badge
                        :color="getPhaseColor(periodToView.number_phases)"
                        :content="periodToView.number_phases"
                      >
                        <v-icon size="small">mdi-sine-wave</v-icon>
                      </v-badge>
                      <span class="ml-2">{{
                        $t('schedulePeriods.phase', periodToView.number_phases)
                      }}</span>
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
            v-if="periodToView"
            @click="() => {
              openEditDialog(periodToView!)
              closeDetailDialog()
            }"
          >
            <v-icon start>mdi-pencil</v-icon>
            {{ $t('schedulePeriods.editSchedulePeriod') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card class="delete-dialog">
        <v-card-title class="delete-title">
          <v-icon color="error" start>mdi-delete</v-icon>
          {{ $t('schedulePeriods.deleteSchedulePeriod') }}
        </v-card-title>

        <v-card-text>
          {{ $t('schedulePeriods.confirmDelete') }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog" :disabled="schedulePeriodsStore.loading">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="schedulePeriodsStore.loading"
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
import { useRouter, useRoute } from 'vue-router'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useChargePointsStore } from '@/stores/chargepoints'
import EnhancedDataGrid from '@/components/EnhancedDataGrid.vue'
import SchedulePeriodForm from '@/components/SchedulePeriodForm.vue'
import type {
  SchedulePeriod,
  CreateSchedulePeriodRequest,
  UpdateSchedulePeriodRequest,
  SchedulePeriodFilters
} from '@/types/scheduleperiods'

const schedulePeriodsStore = useSchedulePeriodsStore()
const chargingProfilesStore = useChargingProfilesStore()
const chargePointsStore = useChargePointsStore()
const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

// Reactive state
const selectedItems = ref<SchedulePeriod[]>([])
const selectionLoading = ref(false)
const deleteLoading = ref(false)
const deleteProgress = ref(0)
const selectedSchedulePeriod = ref<SchedulePeriod | null>(null)
const periodToDelete = ref<SchedulePeriod | null>(null)
const periodToView = ref<SchedulePeriod | null>(null)
const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)
const successMessage = ref('')
const showSuccessAlert = ref(false)
const batchToolbarRef = ref()
const batchDeleteLoading = ref(false)
const batchDeleteProgress = ref(0)
const currentDeleteIndex = ref(0)

// Profile filter from URL
const selectedProfileId = ref<number | undefined>(
  route.query.profile ? Number(route.query.profile) : undefined
)

// Filters
const filters = reactive<SchedulePeriodFilters>({
  search: '',
  charging_profile_id: selectedProfileId.value,
  number_phases: undefined
})

// Table headers
const headers = computed(() => [
  { title: t('schedulePeriods.schedulePeriodId'), key: 'id', sortable: true, width: '80px' },
  { title: t('schedulePeriods.chargingProfile'), key: 'charging_profile_id', sortable: true },
  {
    title: t('schedulePeriods.startPeriod'),
    key: 'start_period_in_seconds',
    sortable: true,
    width: '140px'
  },
  { title: t('schedulePeriods.limit'), key: 'limit', sortable: true, width: '120px' },
  { title: t('schedulePeriods.phases'), key: 'number_phases', sortable: true, width: '120px' },
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
      title: t('schedulePeriods.schedulePeriodId'),
      width: 80,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'charging_profile_id',
      title: t('schedulePeriods.chargingProfile'),

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'start_period_in_seconds',
      title: t('schedulePeriods.startPeriod'),
      width: 140,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'limit',
      title: t('schedulePeriods.limit'),
      width: 120,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'number_phases',
      title: t('schedulePeriods.phases'),
      width: 120,

      sortable: true,
      type: 'number' as const
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
const filteredSchedulePeriods = computed(() => {
  const cleanFilters = {
    search: filters.search || '',
    charging_profile_id: filters.charging_profile_id,
    number_phases: filters.number_phases
  }
  return schedulePeriodsStore.filteredSchedulePeriods(cleanFilters)
})

const profileFilterOptions = computed(() => {
  const allOption = { text: 'All Profiles', value: undefined }
  const profileOptions = chargingProfilesStore.chargingProfiles.map((profile) => {
    const chargePoint = chargePointsStore.getChargePointById(profile.charge_point_id)
    return {
      text: `${profile.description || `Profile ${profile.id}`} - ${
        chargePoint?.ocpp_charge_box_id || 'Unknown CP'
      }`,
      value: profile.id
    }
  })
  return [allOption, ...profileOptions]
})

const phaseFilterOptions = computed(() => [
  { title: t('common.all'), value: undefined },
  { title: t('schedulePeriods.singlePhase'), value: 1 },
  { title: t('schedulePeriods.twoPhase'), value: 2 },
  { title: t('schedulePeriods.threePhase'), value: 3 }
])

// Methods
const formatSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getLimitColor = (limit: number): string => {
  if (limit >= 100) return 'error' // High power
  if (limit >= 50) return 'warning'
  if (limit >= 22) return 'success'
  return 'info' // Low power
}

const getPhaseColor = (phases: number): string => {
  switch (phases) {
    case 1:
      return 'info'
    case 2:
      return 'warning'
    case 3:
      return 'success'
    default:
      return 'grey'
  }
}

const getProfileName = (profileId: number): string => {
  const profile = chargingProfilesStore.getChargingProfileById(profileId)
  return profile?.description || `Profile ${profileId}`
}

const getProfilePurpose = (profileId: number): string => {
  const profile = chargingProfilesStore.getChargingProfileById(profileId)
  return profile?.charging_profile_purpose || 'Unknown'
}

const getProfilePurposeColor = (profileId: number): string => {
  const purpose = getProfilePurpose(profileId)
  switch (purpose) {
    case 'TxDefault':
      return 'primary'
    case 'TxProfile':
      return 'success'
    case 'TxMaxProfile':
      return 'warning'
    default:
      return 'grey'
  }
}

const navigateToChargingProfiles = (): void => {
  router.push('/charging-profiles')
}

const clearProfileFilter = (): void => {
  selectedProfileId.value = undefined
  filters.charging_profile_id = undefined
  router.replace('/schedule-periods')
}

const openCreateDialog = (): void => {
  selectedSchedulePeriod.value = null
  showFormDialog.value = true
}

const openEditDialog = (period: SchedulePeriod): void => {
  selectedSchedulePeriod.value = period
  showFormDialog.value = true
}

const closeFormDialog = (): void => {
  selectedSchedulePeriod.value = null
  showFormDialog.value = false
}

const openDetailDialog = (period: SchedulePeriod): void => {
  periodToView.value = period
  showDetailDialog.value = true
}

const closeDetailDialog = (): void => {
  periodToView.value = null
  showDetailDialog.value = false
}

const openDeleteDialog = (period: SchedulePeriod): void => {
  periodToDelete.value = period
  showDeleteDialog.value = true
}

const closeDeleteDialog = (): void => {
  periodToDelete.value = null
  showDeleteDialog.value = false
}

const handleFormSubmit = async (
  data: CreateSchedulePeriodRequest | UpdateSchedulePeriodRequest
): Promise<void> => {
  let success = false
  const isEdit = 'id' in data

  try {
    if (isEdit) {
      success = await schedulePeriodsStore.updateSchedulePeriod(data as UpdateSchedulePeriodRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('schedulePeriods.updated'))
      }
    } else {
      success = await schedulePeriodsStore.createSchedulePeriod(data as CreateSchedulePeriodRequest)
      if (success) {
        closeFormDialog()
        showSuccessMessage(t('schedulePeriods.created'))
      }
    }
  } catch (error) {
    console.error('Form submit error:', error)
    showErrorMessage(
      t(isEdit ? 'messages.updateError' : 'messages.createError', {
        item: t('schedulePeriods.schedulePeriod')
      })
    )
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!periodToDelete.value?.id) return

  try {
    const success = await schedulePeriodsStore.deleteSchedulePeriod(periodToDelete.value.id)

    if (success) {
      closeDeleteDialog()
      showSuccessMessage(t('schedulePeriods.deleted'))
    }
  } catch (error) {
    console.error('Delete error:', error)
    showErrorMessage(t('messages.deleteError', { item: t('schedulePeriods.schedulePeriod') }))
  }
}

// Export functions
const exportToPDF = async (): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = filteredSchedulePeriods.value.map((period) => ({
      ID: period.id || '-',
      Profile: getProfileName(period.charging_profile_id),
      'Start Time': formatSeconds(period.start_period_in_seconds),
      'Start (s)': period.start_period_in_seconds,
      'Limit (kW)': period.limit,
      Phases: period.number_phases
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Schedule Periods Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Periods: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 40, 25, 20, 25, 15]
    const headers = ['ID', 'Profile', 'Start Time', 'Start (s)', 'Limit (kW)', 'Phases']

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
        const text = String(value).substring(0, 25)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `schedule_periods_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportToExcel = async (): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = filteredSchedulePeriods.value.map((period) => ({
      'Period ID': period.id || '',
      'Charging Profile': getProfileName(period.charging_profile_id),
      'Start Time': formatSeconds(period.start_period_in_seconds),
      'Start Period (seconds)': period.start_period_in_seconds,
      'Power Limit (kW)': period.limit,
      'Number of Phases': period.number_phases
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Schedule Periods')

    wb.Props = {
      Title: 'Schedule Periods Export',
      Subject: 'OCPP Schedule Periods Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `schedule_periods_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportToCSV = async (): Promise<void> => {
  try {
    const headers = [
      'Period ID',
      'Charging Profile',
      'Start Time',
      'Start Period (seconds)',
      'Power Limit (kW)',
      'Number of Phases'
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    filteredSchedulePeriods.value.forEach((period) => {
      const row = [
        `"${period.id || ''}"`,
        `"${getProfileName(period.charging_profile_id).replace(/"/g, '""')}"`,
        `"${formatSeconds(period.start_period_in_seconds)}"`,
        `"${period.start_period_in_seconds}"`,
        `"${period.limit}"`,
        `"${period.number_phases}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `schedule_periods_export_${new Date().toISOString().split('T')[0]}.csv`
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
  schedulePeriodsStore.error = message
}

// Batch selection methods
const clearSelection = (): void => {
  selectedItems.value = []
}

const handleBatchDelete = async (items: SchedulePeriod[]): Promise<void> => {
  if (items.length === 0) return

  batchDeleteLoading.value = true
  currentDeleteIndex.value = 0
  batchDeleteProgress.value = 0
  let successCount = 0
  let failedCount = 0
  const failedItems: string[] = []

  try {
    for (let i = 0; i < items.length; i++) {
      const period = items[i]
      currentDeleteIndex.value = i + 1
      batchDeleteProgress.value = ((i + 1) / items.length) * 100

      try {
        if (period.id) {
          const success = await schedulePeriodsStore.deleteSchedulePeriod(period.id)
          if (success) {
            successCount++
            selectedItems.value = selectedItems.value.filter((item) => item.id !== period.id)
          } else {
            failedCount++
            failedItems.push(`Period ${period.start_period_in_seconds}`)
          }
        } else {
          failedCount++
          failedItems.push(`Period ${period.start_period_in_seconds}`)
        }
      } catch (error) {
        console.error(`Failed to delete schedule period ${period.id}:`, error)
        failedCount++
        failedItems.push(`Period ${period.start_period_in_seconds}`)
      }

      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Clear remaining selection
    const remainingSelected = selectedItems.value.filter(
      (item) => !items.some((deletedItem) => deletedItem.id === item.id)
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
  const selectedPeriods = selectedItems.value

  try {
    switch (format) {
      case 'pdf':
        exportSelectedToPDF(selectedPeriods)
        break
      case 'excel':
        exportSelectedToExcel(selectedPeriods)
        break
      case 'csv':
        exportSelectedToCSV(selectedPeriods)
        break
    }
  } catch (error) {
    console.error('Batch export error:', error)
    showErrorMessage(t('messages.batchExportError'))
  }
}

// Export methods for selected schedule periods
const exportSelectedToPDF = async (selectedPeriods: SchedulePeriod[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = selectedPeriods.map((period) => ({
      ID: period.id || '-',
      Profile: getProfileName(period.charging_profile_id),
      'Start Time': formatSeconds(period.start_period_in_seconds),
      'Start (s)': period.start_period_in_seconds,
      'Limit (kW)': period.limit,
      Phases: period.number_phases
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Selected Schedule Periods Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Selected Periods: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 40, 25, 20, 25, 15]
    const headers = ['ID', 'Profile', 'Start Time', 'Start (s)', 'Limit (kW)', 'Phases']

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
        const text = String(value).substring(0, 25)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `selected_schedule_periods_export_${
      new Date().toISOString().split('T')[0]
    }.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportSelectedToExcel = async (selectedPeriods: SchedulePeriod[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = selectedPeriods.map((period) => ({
      'Period ID': period.id || '',
      'Charging Profile': getProfileName(period.charging_profile_id),
      'Start Time': formatSeconds(period.start_period_in_seconds),
      'Start Period (seconds)': period.start_period_in_seconds,
      'Power Limit (kW)': period.limit,
      'Number of Phases': period.number_phases
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Selected Periods')

    wb.Props = {
      Title: 'Selected Schedule Periods Export',
      Subject: 'OCPP Selected Schedule Periods Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `selected_schedule_periods_export_${
      new Date().toISOString().split('T')[0]
    }.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportSelectedToCSV = async (selectedPeriods: SchedulePeriod[]): Promise<void> => {
  try {
    const headers = [
      'Period ID',
      'Charging Profile',
      'Start Time',
      'Start Period (seconds)',
      'Power Limit (kW)',
      'Number of Phases'
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    selectedPeriods.forEach((period) => {
      const row = [
        `"${period.id || ''}"`,
        `"${getProfileName(period.charging_profile_id).replace(/"/g, '""')}"`,
        `"${formatSeconds(period.start_period_in_seconds)}"`,
        `"${period.start_period_in_seconds}"`,
        `"${period.limit}"`,
        `"${period.number_phases}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `selected_schedule_periods_export_${
      new Date().toISOString().split('T')[0]
    }.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Watch for route changes
watch(
  () => route.query.profile,
  (newProfileId) => {
    if (newProfileId) {
      selectedProfileId.value = Number(newProfileId)
      filters.charging_profile_id = Number(newProfileId)
    } else {
      selectedProfileId.value = undefined
      filters.charging_profile_id = undefined
    }
  }
)

watch(
  () => route.query,
  (newQuery) => {
    const hasGridFilters = Object.keys(newQuery).some(
      (key) =>
        key.startsWith('filter_') ||
        key.startsWith('min_') ||
        key.startsWith('max_') ||
        key.startsWith('from_') ||
        key.startsWith('to_')
    )

    // If user has applied manual filters through the grid, hide the profile filter card
    if (hasGridFilters && selectedProfileId.value) {
      selectedProfileId.value = undefined
      // Don't clear filters.charging_profile_id as the user may want to keep filtering by profile
    }
  },
  { deep: true }
)

// Advanced DataGrid event handlers
const handleFilteredExport = (format: string, items: any[]) => {
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
const handleSelectionChange = (newSelection: SchedulePeriod[]) => {
  selectedItems.value = newSelection
}

const handleDeleteSelected = async (items: SchedulePeriod[]) => {
  if (items.length === 0) return

  try {
    let successCount = 0
    let failedCount = 0
    const failedItems: string[] = []

    for (const period of items) {
      try {
        if (period.id) {
          const success = await schedulePeriodsStore.deleteSchedulePeriod(period.id)
          if (success) {
            successCount++
          } else {
            failedCount++
            failedItems.push(`Period ${period.start_period_in_seconds}`)
          }
        } else {
          failedCount++
          failedItems.push(`Period ${period.start_period_in_seconds}`)
        }
      } catch (error) {
        console.error(`Failed to delete schedule period ${period.id}:`, error)
        failedCount++
        failedItems.push(`Period ${period.start_period_in_seconds}`)
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

const handleExportSelected = (format: 'pdf' | 'excel' | 'csv', items: SchedulePeriod[]) => {
  console.log(`Exporting ${items.length} selected schedule periods to ${format}`)

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

const handleRowClick = (item: any) => {
  console.log('Row clicked:', item)
}

// Export methods for filtered schedule periods
const exportFilteredToPDF = async (filteredPeriods: any[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Filtered Schedule Periods Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Items: ${filteredPeriods.length}`, 20, 35)

    const filename = `filtered_schedule_periods_export_${
      new Date().toISOString().split('T')[0]
    }.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportFilteredToExcel = async (filteredPeriods: any[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')
    const exportData = filteredPeriods.map((period) => ({
      'Period ID': period.id || '',
      'Charging Profile': getProfileName(period.charging_profile_id),
      'Start Period (seconds)': period.start_period_in_seconds,
      Limit: period.limit,
      'Number of Phases': period.number_phases
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Schedule Periods')

    const filename = `filtered_schedule_periods_export_${
      new Date().toISOString().split('T')[0]
    }.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportFilteredToCSV = async (filteredPeriods: any[]): Promise<void> => {
  try {
    const headers = [
      'Period ID',
      'Charging Profile',
      'Start Period (seconds)',
      'Limit',
      'Number of Phases'
    ]
    const csvRows = [headers.join(',')]

    filteredPeriods.forEach((period) => {
      const row = [
        `"${period.id || ''}"`,
        `"${getProfileName(period.charging_profile_id).replace(/"/g, '""')}"`,
        `"${period.start_period_in_seconds}"`,
        `"${period.limit}"`,
        `"${period.number_phases}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const FileSaver = await import('file-saver')

    const filename = `filtered_schedule_periods_export_${
      new Date().toISOString().split('T')[0]
    }.csv`
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
      schedulePeriodsStore.fetchSchedulePeriods(),
      chargingProfilesStore.chargingProfiles.length === 0
        ? chargingProfilesStore.fetchChargingProfiles()
        : Promise.resolve(),
      chargePointsStore.chargePoints.length === 0
        ? chargePointsStore.fetchChargePoints()
        : Promise.resolve()
    ])
  } catch (error) {
    console.error('Failed to load schedule periods data:', error)
  }
})
</script>

<style scoped>
.schedule-periods-container {
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

.profile-filter-card {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.profile-filter {
  display: flex;
  align-items: center;
  color: white;
}

.filter-text {
  color: white;
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

.charging-profile-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-icon {
  color: rgb(var(--v-theme-primary));
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.profile-details {
  font-size: 0.75rem;
}

.start-period-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-display {
  font-weight: 500;
  font-family: monospace;
}

.seconds-display {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
}

.limit-cell {
  text-align: center;
}

.phases-cell {
  display: flex;
  align-items: center;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.export-actions {
  width: 100%;
}

.schedule-period-detail-dialog .detail-title {
  color: rgb(var(--v-theme-info));
  font-weight: 600;
  padding: 20px 24px 16px;
}

.schedule-period-detail-dialog .label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.schedule-period-detail-dialog .value {
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 4px;
}

.schedule-period-detail-dialog .detail-actions {
  padding: 16px 24px 24px;
}

.delete-dialog .delete-title {
  color: rgb(var(--v-theme-error));
  font-weight: 600;
}

@media (max-width: 960px) {
  .schedule-periods-container {
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
