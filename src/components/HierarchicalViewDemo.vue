<template>
  <div class="hierarchical-view-demo">
    <div class="demo-header">
      <h2 class="demo-title">
        <v-icon start>mdi-file-tree</v-icon>
        {{ $t('demo.hierarchicalViewTitle') }}
      </h2>
      <p class="demo-description">
        {{ $t('demo.hierarchicalViewDescription') }}
      </p>

      <div class="demo-controls">
        <v-btn-toggle v-model="selectedDemo" variant="outlined" density="compact">
          <v-btn value="sites">
            <v-icon start>mdi-map-marker</v-icon>
            {{ $t('sites.title') }}
          </v-btn>
          <v-btn value="chargepoints">
            <v-icon start>mdi-ev-station</v-icon>
            {{ $t('chargePoints.title') }}
          </v-btn>
          <v-btn value="chargingprofiles">
            <v-icon start>mdi-chart-timeline</v-icon>
            {{ $t('chargingProfiles.title') }}
          </v-btn>
        </v-btn-toggle>

        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="refreshDemo"
          :loading="loading"
        >
          {{ $t('common.refresh') }}
        </v-btn>
      </div>
    </div>

    <v-divider class="demo-divider" />

    <!-- Sites with Charge Points Demo -->
    <div v-if="selectedDemo === 'sites'" class="demo-section">
      <div class="section-header">
        <h3 class="section-title">
          {{ $t('demo.sitesWithChargePoints') }}
        </h3>
        <v-chip variant="outlined" size="small">
          {{ sitesStore.allSites.length }} {{ $t('sites.title') }}
        </v-chip>
      </div>

      <div class="expandable-items">
        <ExpandableDataRow
          v-for="site in sitesStore.allSites"
          :key="site.site_id"
          :item="site"
          :expanded="siteHierarchy.isExpanded(site)"
          :has-children="siteHierarchy.hasChildren(site)"
          :children-loading="siteHierarchy.isLoading(site)"
          @expand="siteHierarchy.expand"
          @collapse="siteHierarchy.collapse"
          @fetch-children="siteHierarchy.loadChildren"
          @refresh-children="siteHierarchy.refreshChildren"
        >
          <template #parent="{ item }">
            <div class="site-parent-content">
              <div class="site-info">
                <div class="site-primary">
                  <v-icon class="site-icon" color="primary">mdi-map-marker</v-icon>
                  <span class="site-name">{{ item.name }}</span>
                  <v-chip size="x-small" variant="outlined"> ID: {{ item.site_id }} </v-chip>
                </div>
                <div class="site-secondary">
                  <span class="site-address">{{ item.address }}, {{ item.city }}</span>
                  <v-chip size="x-small" color="secondary" variant="tonal">
                    {{ item.country }}
                  </v-chip>
                </div>
              </div>
              <div class="site-stats">
                <v-chip size="small" color="primary" variant="outlined">
                  {{ siteHierarchy.getChildren(item).length }} {{ $t('chargePoints.title') }}
                </v-chip>
              </div>
            </div>
          </template>

          <template #children="{ item, children, loading }">
            <div class="charge-points-children">
              <div class="children-header">
                <h4 class="children-title">
                  <v-icon start>mdi-ev-station</v-icon>
                  {{ $t('chargePoints.title') }}
                </h4>
                <v-chip size="small" variant="outlined">
                  {{ children.length }} {{ $t('common.items') }}
                </v-chip>
              </div>

              <v-progress-linear v-if="loading" indeterminate color="primary" class="loading-bar" />

              <div v-else-if="children.length === 0" class="empty-children">
                <v-icon size="48" color="grey-lighten-1">mdi-ev-station-off</v-icon>
                <p class="empty-text">{{ $t('chargePoints.noChargePoints') }}</p>
              </div>

              <div v-else class="children-list">
                <div v-for="chargePoint in children" :key="chargePoint.id" class="child-item">
                  <div class="child-content">
                    <div class="child-primary">
                      <v-icon class="child-icon" color="success">mdi-ev-station</v-icon>
                      <span class="child-name">{{ chargePoint.ocpp_charge_box_id }}</span>
                      <v-chip
                        :color="getStatusColor(chargePoint.status)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ chargePoint.status }}
                      </v-chip>
                    </div>
                    <div class="child-secondary">
                      <span class="child-manufacturer">
                        {{ chargePoint.manufacturer }} {{ chargePoint.model }}
                      </span>
                      <v-chip size="x-small" variant="outlined">
                        {{ chargePoint.connector_count }} {{ $t('connectors.title') }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </ExpandableDataRow>
      </div>
    </div>

    <!-- Charge Points with Tabs Demo -->
    <div v-if="selectedDemo === 'chargepoints'" class="demo-section">
      <div class="section-header">
        <h3 class="section-title">
          {{ $t('demo.chargePointsWithTabs') }}
        </h3>
        <v-chip variant="outlined" size="small">
          {{ chargePointsStore.allChargePoints.length }} {{ $t('chargePoints.title') }}
        </v-chip>
      </div>

      <div class="expandable-items">
        <ExpandableDataRow
          v-for="chargePoint in chargePointsStore.allChargePoints"
          :key="chargePoint.id"
          :item="chargePoint"
          :expanded="expandedChargePoints.has(chargePoint)"
          :has-children="true"
          :children-loading="false"
          @expand="handleChargePointExpand"
          @collapse="handleChargePointCollapse"
        >
          <template #parent="{ item }">
            <div class="chargepoint-parent-content">
              <div class="chargepoint-info">
                <div class="chargepoint-primary">
                  <v-icon class="chargepoint-icon" color="success">mdi-ev-station</v-icon>
                  <span class="chargepoint-name">{{ item.ocpp_charge_box_id }}</span>
                  <v-chip :color="getStatusColor(item.status)" size="x-small" variant="tonal">
                    {{ item.status }}
                  </v-chip>
                </div>
                <div class="chargepoint-secondary">
                  <span class="chargepoint-details">
                    {{ item.manufacturer }} {{ item.model }}
                  </span>
                  <v-chip size="x-small" color="info" variant="tonal">
                    {{ getSiteName(item.site_id) }}
                  </v-chip>
                </div>
              </div>
              <div class="chargepoint-stats">
                <v-chip size="small" variant="outlined">
                  {{ item.connector_count }} {{ $t('connectors.title') }}
                </v-chip>
              </div>
            </div>
          </template>

          <template #children="{ item }">
            <TabbedChildView
              :parent-item="item"
              :tabs="getChargePointTabs(item)"
              :tab-data="getChargePointTabData(item)"
              :loading-states="getChargePointTabLoadingStates(item)"
              @tab-change="handleTabChange"
              @load-tab-data="handleLoadTabData"
              @refresh-tab-data="handleRefreshTabData"
              @add-item="handleAddChildItem"
            >
              <!-- Connectors Tab -->
              <template #tab-connectors="{ items, loading }">
                <div v-if="loading" class="tab-loading">
                  <v-progress-linear indeterminate color="primary" />
                </div>
                <div v-else-if="items.length === 0" class="tab-empty">
                  <v-icon size="48" color="grey-lighten-1">mdi-power-plug-off</v-icon>
                  <p class="empty-text">{{ $t('connectors.noConnectors') }}</p>
                </div>
                <div v-else class="connectors-content">
                  <div v-for="connector in items" :key="connector.id" class="connector-item">
                    <div class="connector-content">
                      <v-icon class="connector-icon" color="warning">mdi-power-plug</v-icon>
                      <div class="connector-info">
                        <span class="connector-number">
                          {{ $t('connectors.connectorNumber') }}: {{ connector.connector_number }}
                        </span>
                        <span class="connector-type">{{ connector.type }}</span>
                        <span class="connector-power">{{ connector.max_power_kw }} kW</span>
                      </div>
                      <v-chip
                        :color="getConnectorStatusColor(connector.status)"
                        size="small"
                        variant="tonal"
                      >
                        {{ connector.status }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Charging Profiles Tab -->
              <template #tab-chargingprofiles="{ items, loading }">
                <div v-if="loading" class="tab-loading">
                  <v-progress-linear indeterminate color="primary" />
                </div>
                <div v-else-if="items.length === 0" class="tab-empty">
                  <v-icon size="48" color="grey-lighten-1">mdi-chart-timeline-variant</v-icon>
                  <p class="empty-text">{{ $t('chargingProfiles.noChargingProfiles') }}</p>
                </div>
                <div v-else class="charging-profiles-content">
                  <div v-for="profile in items" :key="profile.id" class="profile-item">
                    <div class="profile-content">
                      <v-icon class="profile-icon" color="purple">mdi-chart-timeline</v-icon>
                      <div class="profile-info">
                        <span class="profile-stack">
                          {{ $t('chargingProfiles.stackLevel') }}: {{ profile.stack_level }}
                        </span>
                        <span class="profile-purpose">{{ profile.charging_profile_purpose }}</span>
                        <span class="profile-kind">{{ profile.charging_profile_kind }}</span>
                      </div>
                      <div class="profile-validity">
                        <v-chip size="x-small" variant="outlined">
                          {{ formatDate(profile.valid_from) }} - {{ formatDate(profile.valid_to) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </TabbedChildView>
          </template>
        </ExpandableDataRow>
      </div>
    </div>

    <!-- Charging Profiles with Schedule Periods Demo -->
    <div v-if="selectedDemo === 'chargingprofiles'" class="demo-section">
      <div class="section-header">
        <h3 class="section-title">
          {{ $t('demo.chargingProfilesWithSchedulePeriods') }}
        </h3>
        <v-chip variant="outlined" size="small">
          {{ chargingProfilesStore.allChargingProfiles.length }} {{ $t('chargingProfiles.title') }}
        </v-chip>
      </div>

      <div class="expandable-items">
        <ExpandableDataRow
          v-for="chargingProfile in chargingProfilesStore.allChargingProfiles"
          :key="chargingProfile.id"
          :item="chargingProfile"
          :expanded="schedulePeriodsHierarchy.isExpanded(chargingProfile)"
          :has-children="schedulePeriodsHierarchy.hasChildren(chargingProfile)"
          :children-loading="schedulePeriodsHierarchy.isLoading(chargingProfile)"
          @expand="schedulePeriodsHierarchy.expand"
          @collapse="schedulePeriodsHierarchy.collapse"
          @fetch-children="schedulePeriodsHierarchy.loadChildren"
          @refresh-children="schedulePeriodsHierarchy.refreshChildren"
        >
          <template #parent="{ item }">
            <div class="charging-profile-parent-content">
              <div class="charging-profile-info">
                <div class="charging-profile-primary">
                  <v-icon class="charging-profile-icon" color="purple">mdi-chart-timeline</v-icon>
                  <span class="charging-profile-name"
                    >{{ $t('chargingProfiles.profile') }} #{{ item.id }}</span
                  >
                  <v-chip size="x-small" variant="outlined" color="primary">
                    {{ item.charging_profile_purpose }}
                  </v-chip>
                </div>
                <div class="charging-profile-secondary">
                  <span class="charging-profile-details">
                    {{ item.charging_profile_kind }} | {{ $t('chargingProfiles.stackLevel') }}:
                    {{ item.stack_level }}
                  </span>
                  <v-chip size="x-small" color="secondary" variant="tonal">
                    {{ getChargePointName(item.charge_point_id) }}
                  </v-chip>
                </div>
              </div>
              <div class="charging-profile-stats">
                <v-chip size="small" variant="outlined">
                  {{ schedulePeriodsHierarchy.getChildren(item).length }}
                  {{ $t('schedulePeriods.title') }}
                </v-chip>
              </div>
            </div>
          </template>

          <template #children="{ item, children, loading }">
            <div class="schedule-periods-children">
              <div class="children-header">
                <h4 class="children-title">
                  <v-icon start>mdi-calendar-clock</v-icon>
                  {{ $t('schedulePeriods.title') }}
                </h4>
                <v-chip size="small" variant="outlined">
                  {{ children.length }} {{ $t('common.items') }}
                </v-chip>
              </div>

              <v-progress-linear v-if="loading" indeterminate color="primary" class="loading-bar" />

              <div v-else-if="children.length === 0" class="empty-children">
                <v-icon size="48" color="grey-lighten-1">mdi-calendar-clock-outline</v-icon>
                <p class="empty-text">{{ $t('schedulePeriods.noSchedulePeriods') }}</p>
              </div>

              <div v-else class="children-list">
                <div v-for="schedulePeriod in children" :key="schedulePeriod.id" class="child-item">
                  <div class="child-content">
                    <div class="child-primary">
                      <v-icon class="child-icon" color="orange">mdi-calendar-clock</v-icon>
                      <span class="child-name">
                        {{ $t('schedulePeriods.period') }}
                        {{ formatDuration(schedulePeriod.start_period_in_seconds) }}
                      </span>
                      <v-chip color="success" size="x-small" variant="tonal">
                        {{ schedulePeriod.limit }} kW
                      </v-chip>
                    </div>
                    <div class="child-secondary">
                      <span class="child-phases">
                        {{ schedulePeriod.number_phases }} {{ $t('schedulePeriods.phases') }}
                      </span>
                      <v-chip size="x-small" variant="outlined">
                        {{ formatDuration(schedulePeriod.start_period_in_seconds) }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </ExpandableDataRow>
      </div>
    </div>

    <!-- Statistics -->
    <div class="demo-stats">
      <v-card variant="outlined" class="stats-card">
        <v-card-title class="stats-title">
          <v-icon start>mdi-chart-box</v-icon>
          {{ $t('demo.statistics') }}
        </v-card-title>
        <v-card-text>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">{{ $t('demo.totalSites') }}</span>
              <span class="stat-value">{{ sitesStore.allSites.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('demo.totalChargePoints') }}</span>
              <span class="stat-value">{{ chargePointsStore.allChargePoints.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('demo.expandedItems') }}</span>
              <span class="stat-value">
                {{
                  selectedDemo === 'sites'
                    ? siteHierarchy.expandedItems.value.size
                    : expandedChargePoints.size
                }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('demo.loadingItems') }}</span>
              <span class="stat-value">
                {{ selectedDemo === 'sites' ? siteHierarchy.loadingStates.value.size : 0 }}
              </span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSitesStore } from '@/stores/sites'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useConnectorsStore } from '@/stores/connectors'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import {
  useSiteChargePoints,
  useChargePointChildren,
  useChargingProfileChildren
} from '@/composables/useHierarchicalData'
import ExpandableDataRow from './ExpandableDataRow.vue'
import TabbedChildView from './TabbedChildView.vue'
import type { ChargePoint } from '@/types/chargepoints'
import type { ChildTab } from './TabbedChildView.vue'

const { t } = useI18n()
const sitesStore = useSitesStore()
const chargePointsStore = useChargePointsStore()
const connectorsStore = useConnectorsStore()
const chargingProfilesStore = useChargingProfilesStore()
const schedulePeriodsStore = useSchedulePeriodsStore()

// Demo state
const selectedDemo = ref<'sites' | 'chargepoints'>('sites')
const loading = ref(false)

// Hierarchical data management
const siteHierarchy = useSiteChargePoints()
const { connectors: connectorsHierarchy, chargingProfiles: chargingProfilesHierarchy } =
  useChargePointChildren()
const { schedulePeriods: schedulePeriodsHierarchy } = useChargingProfileChildren()

// Charge points expansion state (for demo purposes)
const expandedChargePoints = ref<Set<ChargePoint>>(new Set())
const connectorsData = ref<Map<ChargePoint, any[]>>(new Map())
const chargingProfilesData = ref<Map<ChargePoint, any[]>>(new Map())
const connectorsLoading = ref<Set<ChargePoint>>(new Set())
const chargingProfilesLoading = ref<Set<ChargePoint>>(new Set())

// Methods
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

const getConnectorStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'success'
    case 'faulted':
      return 'error'
    default:
      return 'primary'
  }
}

const getSiteName = (siteId: number): string => {
  const site = sitesStore.getSiteById(siteId)
  return site?.name || `Site ${siteId}`
}

const getChargePointName = (chargePointId: number): string => {
  const chargePoint = chargePointsStore.getChargePointById(chargePointId)
  return chargePoint?.ocpp_charge_box_id || `Charge Point ${chargePointId}`
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

// Charge Points with Tabs methods
const handleChargePointExpand = (chargePoint: ChargePoint) => {
  expandedChargePoints.value.add(chargePoint)
}

const handleChargePointCollapse = (chargePoint: ChargePoint) => {
  expandedChargePoints.value.delete(chargePoint)
}

const getChargePointTabs = (chargePoint: ChargePoint): ChildTab[] => {
  return [
    {
      key: 'connectors',
      title: t('connectors.title'),
      icon: 'mdi-power-plug',
      description: t('connectors.description'),
      allowAdd: true,
      autoLoad: true,
      emptyTitle: t('connectors.noConnectors'),
      emptyDescription: t('connectors.noConnectorsDescription'),
      emptyIcon: 'mdi-power-plug-off'
    },
    {
      key: 'chargingprofiles',
      title: t('chargingProfiles.title'),
      icon: 'mdi-chart-timeline',
      description: t('chargingProfiles.description'),
      allowAdd: true,
      autoLoad: true,
      emptyTitle: t('chargingProfiles.noChargingProfiles'),
      emptyDescription: t('chargingProfiles.noChargingProfilesDescription'),
      emptyIcon: 'mdi-chart-timeline-variant'
    }
  ]
}

const getChargePointTabData = (chargePoint: ChargePoint): Record<string, any[]> => {
  return {
    connectors: connectorsData.value.get(chargePoint) || [],
    chargingprofiles: chargingProfilesData.value.get(chargePoint) || []
  }
}

const getChargePointTabLoadingStates = (chargePoint: ChargePoint): Record<string, boolean> => {
  return {
    connectors: connectorsLoading.value.has(chargePoint),
    chargingprofiles: chargingProfilesLoading.value.has(chargePoint)
  }
}

const handleTabChange = (tabKey: string, chargePoint: ChargePoint) => {
  console.log('Tab changed:', tabKey, 'for charge point:', chargePoint.id)
}

const handleLoadTabData = async (tabKey: string, chargePoint: ChargePoint) => {
  if (!chargePoint.id) return

  switch (tabKey) {
    case 'connectors':
      await loadConnectors(chargePoint)
      break
    case 'chargingprofiles':
      await loadChargingProfiles(chargePoint)
      break
  }
}

const handleRefreshTabData = async (tabKey: string, chargePoint: ChargePoint) => {
  switch (tabKey) {
    case 'connectors':
      connectorsData.value.delete(chargePoint)
      await loadConnectors(chargePoint)
      break
    case 'chargingprofiles':
      chargingProfilesData.value.delete(chargePoint)
      await loadChargingProfiles(chargePoint)
      break
  }
}

const handleAddChildItem = (tabKey: string, chargePoint: ChargePoint) => {
  console.log('Add item:', tabKey, 'for charge point:', chargePoint.id)
}

const loadConnectors = async (chargePoint: ChargePoint) => {
  if (!chargePoint.id) return

  connectorsLoading.value.add(chargePoint)

  try {
    if (connectorsStore.allConnectors.length === 0) {
      await connectorsStore.fetchConnectors()
    }

    const chargePointConnectors = connectorsStore.connectorsByChargePoint(chargePoint.id)
    connectorsData.value.set(chargePoint, chargePointConnectors)
  } catch (error) {
    console.error('Failed to load connectors:', error)
  } finally {
    connectorsLoading.value.delete(chargePoint)
  }
}

const loadChargingProfiles = async (chargePoint: ChargePoint) => {
  if (!chargePoint.id) return

  chargingProfilesLoading.value.add(chargePoint)

  try {
    if (chargingProfilesStore.allChargingProfiles.length === 0) {
      await chargingProfilesStore.fetchChargingProfiles()
    }

    const chargePointProfiles = chargingProfilesStore.chargingProfilesByChargePoint(chargePoint.id)
    chargingProfilesData.value.set(chargePoint, chargePointProfiles)
  } catch (error) {
    console.error('Failed to load charging profiles:', error)
  } finally {
    chargingProfilesLoading.value.delete(chargePoint)
  }
}

const refreshDemo = async () => {
  loading.value = true

  try {
    // Clear all cached data
    siteHierarchy.clearData()
    connectorsHierarchy.clearData()
    chargingProfilesHierarchy.clearData()
    schedulePeriodsHierarchy.clearData()
    expandedChargePoints.value.clear()
    connectorsData.value.clear()
    chargingProfilesData.value.clear()

    // Reload main data
    await Promise.all([
      sitesStore.fetchSites(),
      chargePointsStore.fetchChargePoints(),
      connectorsStore.fetchConnectors(),
      chargingProfilesStore.fetchChargingProfiles(),
      schedulePeriodsStore.fetchSchedulePeriods()
    ])
  } catch (error) {
    console.error('Failed to refresh demo data:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await refreshDemo()
})
</script>

<style scoped>
.hierarchical-view-demo {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  margin-bottom: 32px;
}

.demo-title {
  font-size: 2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-background));
  margin-bottom: 8px;
}

.demo-description {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 24px;
  line-height: 1.6;
}

.demo-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.demo-divider {
  margin: 24px 0;
}

.demo-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.expandable-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Site parent content */
.site-parent-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.site-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.site-primary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.site-icon {
  flex-shrink: 0;
}

.site-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface));
}

.site-secondary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 36px;
}

.site-address {
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.site-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Charge Points children */
.charge-points-children {
  padding: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.children-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.children-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.loading-bar {
  margin: 16px 0;
}

.empty-children {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.empty-text {
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 12px 0 0;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.child-item {
  background: rgb(var(--v-theme-surface));
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.child-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.child-primary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.child-icon {
  flex-shrink: 0;
}

.child-name {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.child-secondary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 36px;
}

.child-manufacturer {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Charge Point parent content */
.chargepoint-parent-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.chargepoint-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.chargepoint-primary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chargepoint-icon {
  flex-shrink: 0;
}

.chargepoint-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface));
}

.chargepoint-secondary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 36px;
}

.chargepoint-details {
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.chargepoint-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Charging Profile parent content */
.charging-profile-parent-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.charging-profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.charging-profile-primary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.charging-profile-icon {
  flex-shrink: 0;
}

.charging-profile-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface));
}

.charging-profile-secondary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 36px;
}

.charging-profile-details {
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.charging-profile-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Schedule Periods children */
.schedule-periods-children {
  padding: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.child-phases {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Tab content */
.tab-loading,
.tab-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.connectors-content,
.charging-profiles-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connector-item,
.profile-item {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.connector-content,
.profile-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connector-icon,
.profile-icon {
  flex-shrink: 0;
}

.connector-info,
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.connector-number,
.profile-stack {
  font-weight: 500;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface));
}

.connector-type,
.connector-power,
.profile-purpose,
.profile-kind {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.profile-validity {
  display: flex;
  align-items: center;
}

/* Statistics */
.demo-stats {
  margin-top: 32px;
}

.stats-card {
  border-radius: 12px;
}

.stats-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  padding: 12px;
  background: rgba(var(--v-theme-primary), 0.04);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hierarchical-view-demo {
    padding: 16px;
  }

  .demo-title {
    font-size: 1.75rem;
  }

  .demo-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .site-parent-content,
  .chargepoint-parent-content,
  .charging-profile-parent-content {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .site-stats,
  .chargepoint-stats,
  .charging-profile-stats {
    justify-content: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .child-primary,
  .chargepoint-primary,
  .charging-profile-primary,
  .site-primary {
    flex-wrap: wrap;
  }

  .child-secondary,
  .chargepoint-secondary,
  .charging-profile-secondary,
  .site-secondary {
    margin-left: 0;
    flex-wrap: wrap;
  }
}
</style>
