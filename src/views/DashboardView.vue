<template>
  <div class="dashboard">
    <h1 class="text-h4 mb-6">
      {{ $t('dashboard.title') }}
    </h1>

    <!-- Summary Cards -->
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          class="summary-card"
          elevation="2"
        >
          <v-card-item>
            <v-card-title class="text-subtitle-1 text-medium-emphasis">
              {{
                $t('dashboard.totalSites')
              }}
            </v-card-title>
            <div class="d-flex align-center mt-2">
              <span class="text-h4 font-weight-bold">{{ totalSites }}</span>
              <v-chip
                class="ml-4"
                color="info"
                size="small"
                variant="outlined"
              >
                <v-icon
                  size="small"
                  start
                >
                  mdi-map-marker
                </v-icon>
                Sites
              </v-chip>
            </div>
          </v-card-item>
          <v-card-text class="pt-0">
            <div class="text-caption text-medium-emphasis">
              {{ $t('dashboard.currentlyActive') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          class="summary-card"
          elevation="2"
        >
          <v-card-item>
            <v-card-title class="text-subtitle-1 text-medium-emphasis">
              {{
                $t('dashboard.totalChargePoints')
              }}
            </v-card-title>
            <div class="d-flex align-center mt-2">
              <span class="text-h4 font-weight-bold">{{ totalChargePoints }}</span>
              <v-chip
                class="ml-4"
                color="success"
                size="small"
                variant="outlined"
              >
                <v-icon
                  size="small"
                  start
                >
                  mdi-ev-station
                </v-icon>
                EVSEs
              </v-chip>
            </div>
          </v-card-item>
          <v-card-text class="pt-0">
            <div class="text-caption text-medium-emphasis">
              {{ $t('dashboard.currentlyActive') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          class="summary-card"
          elevation="2"
        >
          <v-card-item>
            <v-card-title class="text-subtitle-1 text-medium-emphasis">
              {{
                $t('dashboard.totalConnectors')
              }}
            </v-card-title>
            <div class="d-flex align-center mt-2">
              <span class="text-h4 font-weight-bold">{{ totalConnectors }}</span>
              <v-chip
                class="ml-4"
                color="warning"
                size="small"
                variant="outlined"
              >
                <v-icon
                  size="small"
                  start
                >
                  mdi-power-plug
                </v-icon>
                Connectors
              </v-chip>
            </div>
          </v-card-item>
          <v-card-text class="pt-0">
            <div class="text-caption text-medium-emphasis">
              {{ $t('dashboard.currentlyActive') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Time Period Selector -->
    <v-card
      class="mt-6"
      elevation="2"
    >
      <v-card-item>
        <v-card-title>{{ $t('dashboard.energyConsumption') }}</v-card-title>
        <template #append>
          <v-tabs
            v-model="timeRange"
            color="primary"
          >
            <v-tab value="daily">
              {{ $t('dashboard.daily') }}
            </v-tab>
            <v-tab value="weekly">
              {{ $t('dashboard.weekly') }}
            </v-tab>
            <v-tab value="monthly">
              {{ $t('dashboard.monthly') }}
            </v-tab>
          </v-tabs>
        </template>
      </v-card-item>

      <v-card-text>
        <v-window v-model="timeRange">
          <v-window-item value="daily">
            <!-- Daily Chart (Bar Chart) -->
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-bars">
                  <div
                    v-for="(value, index) in dailyData"
                    :key="index"
                    class="chart-bar"
                    :style="{ height: `${value * 2}px` }"
                  >
                    <span class="chart-value">{{ formatEnergy(value, 'kWh') }}</span>
                  </div>
                </div>
                <div class="chart-labels">
                  <div
                    v-for="(label, index) in dailyLabels"
                    :key="index"
                    class="chart-label"
                  >
                    {{ label }}
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="weekly">
            <!-- Weekly Chart -->
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-bars">
                  <div
                    v-for="(value, index) in weeklyData"
                    :key="index"
                    class="chart-bar"
                    :style="{ height: `${value}px` }"
                  >
                    <span class="chart-value">{{ formatEnergy(value, 'kWh') }}</span>
                  </div>
                </div>
                <div class="chart-labels">
                  <div
                    v-for="(label, index) in weeklyLabels"
                    :key="index"
                    class="chart-label"
                  >
                    {{ label }}
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="monthly">
            <!-- Monthly Chart -->
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-bars">
                  <div
                    v-for="(value, index) in monthlyData"
                    :key="index"
                    class="chart-bar"
                    :style="{ height: `${value / 2}px` }"
                  >
                    <span class="chart-value">{{ formatEnergy(value, 'kWh') }}</span>
                  </div>
                </div>
                <div class="chart-labels">
                  <div
                    v-for="(label, index) in monthlyLabels"
                    :key="index"
                    class="chart-label"
                  >
                    {{ label }}
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Recent Activity Table -->
    <v-card
      class="mt-6"
      elevation="2"
    >
      <v-card-title class="d-flex align-center">
        {{ $t('dashboard.recentChargePoints') }}
        <v-spacer />
        <v-btn
          variant="text"
          color="primary"
          size="small"
        >
          {{ $t('dashboard.viewAll') }}
          <v-icon end>
            mdi-chevron-right
          </v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="dashboardHeaders"
          :items="recentChargePoints"
          :items-per-page="5"
          :sortable="true"
          class="dashboard-table"
          hide-default-footer
        >
          <!-- Status column with chip -->
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="outlined"
            >
              {{ $t(`status.${item.status?.toLowerCase()}`) }}
            </v-chip>
          </template>

          <!-- Last Update column -->
          <template #item.lastUpdate="{ item }">
            {{ item.lastUpdate ? formatDateTime(item.lastUpdate) : '-' }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSitesStore } from '@/stores/sites'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useConnectorsStore } from '@/stores/connectors'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'
import { formatDateTime } from '@/utils/dateUtils'

const { t } = useI18n()
const {  formatEnergy } = useLocaleFormatting()
const sitesStore = useSitesStore()
const chargePointsStore = useChargePointsStore()
const connectorsStore = useConnectorsStore()
const chargingProfilesStore = useChargingProfilesStore()

// Time range tabs
const timeRange = ref('daily')

// Computed dashboard statistics
const totalSites = computed(() => sitesStore.sites.length)
const totalChargePoints = computed(() => chargePointsStore.chargePoints.length)
const totalConnectors = computed(() => connectorsStore.connectors.length)
const totalChargingProfiles = computed(() => chargingProfilesStore.chargingProfiles.length)

// Dashboard table headers
const dashboardHeaders = computed(() => [
  { title: t('dashboard.chargePoint'), key: 'chargePoint', sortable: true },
  { title: t('chargepoints.site'), key: 'site', sortable: true },
  { title: t('chargepoints.manufacturer'), key: 'manufacturer', sortable: true },
  { title: t('chargepoints.model'), key: 'model', sortable: true },
  { title: t('chargepoints.connectors'), key: 'connectors', sortable: true },
  { title: t('common.status'), key: 'status', sortable: true },
  { title: t('common.updated'), key: 'lastUpdate', sortable: true }
])

// Active charge points
const activeChargePoints = computed(
  () => chargePointsStore.chargePoints.filter((cp) => cp.status === 'active').length
)

// Available connectors
const availableConnectors = computed(
  () => connectorsStore.connectors.filter((connector) => connector.status === 'available').length
)

// Chart data based on real entities
const dailyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dailyData = computed(() => {
  // Generate data based on actual charge points and connectors
  const baseValue = Math.max(5, Math.floor(totalChargePoints.value / 2))
  return dailyLabels.map((_, index) => {
    // Add some variation based on day of week and actual data
    const variation = Math.sin(index * 0.8) * 10 + (index % 2) * 8
    return Math.max(0, Math.floor(baseValue + variation + totalConnectors.value * 0.3))
  })
})

const weeklyLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
const weeklyData = computed(() => {
  // Generate weekly data based on sites and charge points
  const baseValue = Math.max(20, totalSites.value * 15)
  return weeklyLabels.map((_, index) => {
    const variation = (index % 2) * 30 + totalChargePoints.value * 2
    return Math.floor(baseValue + variation)
  })
})

const monthlyLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]
const monthlyData = computed(() => {
  // Generate monthly data based on total entities
  const baseValue = Math.max(50, totalSites.value * 30)
  return monthlyLabels.map((_, index) => {
    // Create seasonal variation with actual data influence
    const seasonal = Math.sin((index / 12) * Math.PI * 2) * 50
    const growth = index * (totalChargePoints.value * 0.8)
    const random = (index % 3) * 20 - 10
    return Math.max(0, Math.floor(baseValue + seasonal + growth + random))
  })
})

// Recent charge points data (last created/updated)
const recentChargePoints = computed(() => {
  return chargePointsStore.chargePoints
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
      return dateB - dateA // Sort descending (newest first)
    })
    .slice(0, 5) // Take only first 5
    .map((cp) => ({
      chargePoint: cp.ocpp_charge_box_id,
      site: sitesStore.getSiteById(cp.site_id)?.name || `Site ${cp.site_id}`,
      manufacturer: cp.manufacturer,
      model: cp.model,
      connectors: cp.connector_count,
      status: cp.status,
      lastUpdate: cp.updated_at || cp.created_at
    }))
})

// Note: formatDate is now provided by useLocaleFormatting composable

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'faulty':
      return 'error'
    default:
      return 'grey'
  }
}

// Load data on component mount
onMounted(async () => {
  try {
    await Promise.all([
      sitesStore.fetchSites(),
      chargePointsStore.fetchChargePoints(),
      connectorsStore.fetchConnectors(),
      chargingProfilesStore.fetchChargingProfiles()
    ])
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 16px;
}

.summary-card {
  height: 100%;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-4px);
}

.chart-container {
  height: 300px;
  margin-top: 16px;
  position: relative;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 250px;
  padding: 0 16px;
}

.chart-bar {
  width: 40px;
  background-color: var(--color-accent-blue);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.5s;
  min-height: 20px;
}

.chart-value {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  padding: 8px 16px;
}

.chart-label {
  width: 40px;
  text-align: center;
  font-size: 12px;
  color: var(--secondary-text-color);
}

@media (max-width: 600px) {
  .chart-bar {
    width: 24px;
  }

  .chart-label {
    width: 24px;
    font-size: 10px;
  }

  .chart-value {
    font-size: 10px;
  }
}
</style>
