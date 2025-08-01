<template>
  <div class="charging-profiles-container">
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
      v-if="chargingProfilesStore.error"
      type="error"
      class="error-alert"
      closable
      @click:close="chargingProfilesStore.clearError()"
    >
      {{ chargingProfilesStore.error }}
    </v-alert>

    <!-- Header -->
    <div class="header-section">
      <h1 class="page-title">{{ $t('chargingProfiles.title') }}</h1>
      <div class="header-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="create-btn">
          {{ $t('chargingProfiles.addProfile') }}
        </v-btn>
      </div>
    </div>

    <!-- Filters Card -->
    <v-card class="filters-card" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="3" md="4">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-calendar-clock"
              @click="navigateToSchedulePeriods"
              size="small"
              block
              class="manage-schedules-btn"
            >
              <span class="btn-text">{{ $t('chargingProfiles.manageSchedules') }}</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Grid -->
    <v-card class="data-grid-card" elevation="2">
      <!-- Hierarchical View -->
      <div v-if="false" class="hierarchical-view">
        <div
          v-for="profile in filteredChargingProfiles"
          :key="profile.id"
          class="profile-row-container"
        >
          <ExpandableDataRow
            :item="profile"
            :has-children="true"
            :loading="isLoading(profile)"
            @toggle="() => toggleExpansion(profile)"
          >
            <template #parent="{ item, expanded }">
              <div class="profile-parent-content">
                <div class="profile-info">
                  <div class="profile-header">
                    <h3 class="profile-description">
                      {{ item.description || $t('chargingProfiles.untitled') }}
                    </h3>
                    <div class="profile-chips">
                      <v-chip
                        :color="getPurposeColor(item.charging_profile_purpose)"
                        size="small"
                        variant="tonal"
                      >
                        {{ $t(`chargingProfiles.purpose${item.charging_profile_purpose}`) }}
                      </v-chip>
                      <v-chip
                        :color="getKindColor(item.charging_profile_kind)"
                        size="small"
                        variant="outlined"
                      >
                        {{ $t(`chargingProfiles.kind${item.charging_profile_kind}`) }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="profile-details">
                    <div class="detail-row">
                      <v-icon size="small" class="detail-icon">mdi-ev-station</v-icon>
                      <span>{{ getChargePointName(item.charge_point_id) }}</span>
                    </div>
                    <div class="detail-row">
                      <v-icon size="small" class="detail-icon">mdi-layers</v-icon>
                      <span>{{ $t('chargingProfiles.stackLevel') }}: {{ item.stack_level }}</span>
                    </div>
                    <div class="detail-row">
                      <v-icon size="small" class="detail-icon">mdi-calendar</v-icon>
                      <span
                        >{{ formatDateTime(item.valid_from) }} -
                        {{ formatDateTime(item.valid_to) }}</span
                      >
                    </div>
                    <div v-if="item.duration_in_seconds" class="detail-row">
                      <v-icon size="small" class="detail-icon">mdi-clock</v-icon>
                      <span>{{ formatDuration(item.duration_in_seconds) }}</span>
                    </div>
                  </div>
                </div>
                <div class="profile-actions">
                  <v-btn
                    icon="mdi-clock-outline"
                    variant="text"
                    color="info"
                    size="small"
                    @click.stop="manageSchedulePeriods(item)"
                  />
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    color="info"
                    size="small"
                    @click.stop="openDetailDialog(item)"
                  />
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    size="small"
                    @click.stop="openEditDialog(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click.stop="openDeleteDialog(item)"
                  />
                </div>
              </div>
            </template>

            <template #children>
              <div class="schedule-periods-section">
                <TabbedChildView
                  :tabs="[
                    {
                      key: 'schedulePeriods',
                      title: $t('schedulePeriods.title'),
                      icon: 'mdi-clock-outline',
                      count: getChildren(profile)?.length || 0
                    }
                  ]"
                  :loading="isLoading(profile)"
                  :error="getError(profile)"
                  @refresh="() => loadChildren(profile)"
                >
                  <template #schedulePeriods>
                    <div v-if="getChildren(profile)?.length" class="schedule-periods-grid">
                      <div
                        v-for="period in getChildren(profile)"
                        :key="period.id"
                        class="schedule-period-card"
                      >
                        <div class="period-header">
                          <h4 class="period-title">
                            {{ $t('schedulePeriods.period') }} {{ period.start_period }}
                          </h4>
                          <v-chip color="primary" size="small" variant="tonal">
                            {{ period.power_limit }} {{ period.power_limit_unit || 'A' }}
                          </v-chip>
                        </div>
                        <div class="period-details">
                          <div class="detail-row">
                            <v-icon size="small">mdi-clock-start</v-icon>
                            <span
                              >{{ $t('schedulePeriods.startPeriod') }}:
                              {{ period.start_period }}s</span
                            >
                          </div>
                          <div class="detail-row">
                            <v-icon size="small">mdi-lightning-bolt</v-icon>
                            <span
                              >{{ period.power_limit }} {{ period.power_limit_unit || 'A' }}</span
                            >
                          </div>
                          <div v-if="period.phase_to_use" class="detail-row">
                            <v-icon size="small">mdi-sine-wave</v-icon>
                            <span
                              >{{ $t('schedulePeriods.phase') }}: {{ period.phase_to_use }}</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="empty-state">
                      <v-icon size="large" color="grey">mdi-clock-outline</v-icon>
                      <p class="empty-message">{{ $t('schedulePeriods.noPeriods') }}</p>
                      <v-btn
                        color="primary"
                        variant="tonal"
                        prepend-icon="mdi-plus"
                        @click="addSchedulePeriodToProfile(profile)"
                        class="add-period-btn"
                      >
                        {{ $t('schedulePeriods.addPeriod') }}
                      </v-btn>
                    </div>
                  </template>
                </TabbedChildView>
              </div>
            </template>
          </ExpandableDataRow>
        </div>
      </div>

      <!-- Standard Data Grid View -->
      <EnhancedDataGrid
        :columns="advancedHeaders"
        :items="filteredChargingProfiles"
        :loading="chargingProfilesStore.loading"
        :table-key="'charging-profiles'"
        :enable-selection="true"
        :show-expand="true"
        :selection-loading="selectionLoading"
        :delete-loading="deleteLoading"
        :delete-progress="deleteProgress"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        @export-selected="handleExportSelected"
        @delete-selected="handleDeleteSelected"
      >
        <!-- Stack Level column with badge -->
        <template v-slot:item.stack_level="{ item }">
          <v-badge :color="getStackLevelColor(item.stack_level)" :content="item.stack_level">
            <v-icon size="small">mdi-layers</v-icon>
          </v-badge>
        </template>

        <!-- Purpose column with chip -->
        <template v-slot:item.charging_profile_purpose="{ item }">
          <v-chip
            :color="getPurposeColor(item.charging_profile_purpose)"
            size="small"
            variant="tonal"
          >
            {{ $t(`chargingProfiles.purpose${item.charging_profile_purpose}`) }}
          </v-chip>
        </template>

        <!-- Kind column with chip -->
        <template v-slot:item.charging_profile_kind="{ item }">
          <v-chip :color="getKindColor(item.charging_profile_kind)" size="small" variant="outlined">
            {{ $t(`chargingProfiles.kind${item.charging_profile_kind}`) }}
          </v-chip>
        </template>

        <!-- Charge Point column -->
        <template v-slot:item.charge_point_id="{ item }">
          <div class="charge-point-cell">
            <v-icon class="charge-point-icon" size="small">mdi-ev-station</v-icon>
            {{ getChargePointName(item.charge_point_id) }}
          </div>
        </template>

        <!-- Valid From/To columns -->
        <template v-slot:item.valid_from="{ item }">
          {{ formatDateTime(item.valid_from) }}
        </template>

        <template v-slot:item.valid_to="{ item }">
          {{ formatDateTime(item.valid_to) }}
        </template>

        <!-- Duration column -->
        <template v-slot:item.duration_in_seconds="{ item }">
          {{ item.duration_in_seconds ? formatDuration(item.duration_in_seconds) : '-' }}
        </template>

        <!-- Min Charging Rate column -->
        <template v-slot:item.min_charging_rate="{ item }">
          {{ item.min_charging_rate ? `${item.min_charging_rate} kW` : '-' }}
        </template>

        <!-- Actions column -->
        <template v-slot:item.actions="{ item }">
          <div class="actions-cell">
            <v-tooltip :text="$t('chargingProfiles.manageSchedules')" location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="text"
                  color="info"
                  size="small"
                  @click="manageSchedulePeriods(item)"
                  :aria-label="$t('chargingProfiles.manageSchedules')"
                >
                  <v-icon>mdi-clock-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

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

        <!-- Expanded row content for hierarchical data -->
        <template v-slot:expanded-row="{ item }">
          <tr>
            <td :colspan="advancedHeaders.length" class="pa-0">
              <div class="expanded-content-wrapper">
                <TabbedChildView
                  :tabs="[
                    {
                      key: 'schedulePeriods',
                      title: $t('schedulePeriods.title'),
                      icon: 'mdi-clock-outline',
                      count: getSchedulePeriodsCount(item)
                    }
                  ]"
                  :loading="isLoading(item)"
                  :error="getError(item)"
                  @refresh="() => loadChildren(item)"
                >
                  <template #schedulePeriods>
                    <div v-if="getSchedulePeriods(item)?.length" class="child-items-container">
                      <v-row class="ma-0">
                        <v-col
                          v-for="period in getSchedulePeriods(item)"
                          :key="period.id"
                          cols="12"
                          sm="6"
                          md="4"
                          class="pa-2"
                        >
                          <v-card class="child-item-card" variant="outlined">
                            <v-card-text class="pa-3">
                              <div class="d-flex justify-space-between align-center mb-2">
                                <div class="d-flex align-center">
                                  <v-icon class="me-2" color="primary" size="small"
                                    >mdi-clock-outline</v-icon
                                  >
                                  <span class="text-subtitle-2 font-weight-medium">
                                    {{ $t('schedulePeriods.period') }} {{ period.start_period }}
                                  </span>
                                </div>
                                <v-chip color="info" size="x-small" variant="tonal">
                                  {{ period.limit }} {{ period.limit_unit || 'A' }}
                                </v-chip>
                              </div>
                              <div class="child-details">
                                <div v-if="period.number_phases" class="detail-item">
                                  <v-icon size="x-small" class="me-1">mdi-numeric</v-icon>
                                  <span class="text-caption"
                                    >{{ period.number_phases }} phases</span
                                  >
                                </div>
                                <div v-if="period.phase_to_use" class="detail-item">
                                  <v-icon size="x-small" class="me-1">mdi-sine-wave</v-icon>
                                  <span class="text-caption">Phase {{ period.phase_to_use }}</span>
                                </div>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>
                    <div v-else class="empty-state text-center pa-6">
                      <v-icon size="32" color="grey-lighten-1">mdi-clock-outline</v-icon>
                      <div class="text-body-2 text-medium-emphasis mt-2">
                        {{ $t('schedulePeriods.noPeriods') }}
                      </div>
                    </div>
                  </template>
                </TabbedChildView>
              </div>
            </td>
          </tr>
        </template>
      </EnhancedDataGrid>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showFormDialog" max-width="900px" persistent>
      <ChargingProfileForm
        :charging-profile="selectedChargingProfile"
        :loading="chargingProfilesStore.loading"
        @submit="handleFormSubmit"
        @cancel="closeFormDialog"
      />
    </v-dialog>

    <!-- Charging Profile Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="800px">
      <v-card class="charging-profile-detail-dialog">
        <v-card-title class="detail-title">
          <v-icon color="info" start>mdi-information</v-icon>
          {{ $t('chargingProfiles.profileDetails') }}
        </v-card-title>

        <v-card-text>
          <v-container v-if="profileToView">
            <v-row>
              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.profileId') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      profileToView.id || 'N/A'
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.chargePoint') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      getChargePointName(profileToView.charge_point_id)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.stackLevel') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      profileToView.stack_level
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.purpose') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">
                      <v-chip
                        :color="getPurposeColor(profileToView.charging_profile_purpose)"
                        size="small"
                        variant="tonal"
                      >
                        {{
                          $t(`chargingProfiles.purpose${profileToView.charging_profile_purpose}`)
                        }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.kind') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">
                      <v-chip
                        :color="getKindColor(profileToView.charging_profile_kind)"
                        size="small"
                        variant="outlined"
                      >
                        {{ $t(`chargingProfiles.kind${profileToView.charging_profile_kind}`) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" sm="6">
                <v-list density="compact">
                  <v-list-item v-if="profileToView.recurrency_kind">
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.recurrencyKind') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      $t(`chargingProfiles.recurrency${profileToView.recurrency_kind}`)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.validFrom') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      formatDateTime(profileToView.valid_from)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.validTo') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      formatDateTime(profileToView.valid_to)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="profileToView.duration_in_seconds">
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.durationSeconds') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value">{{
                      formatDuration(profileToView.duration_in_seconds)
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item v-if="profileToView.min_charging_rate">
                    <v-list-item-title class="label"
                      >{{ $t('chargingProfiles.minChargingRate') }}:</v-list-item-title
                    >
                    <v-list-item-subtitle class="value"
                      >{{ profileToView.min_charging_rate }} kW</v-list-item-subtitle
                    >
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-row v-if="profileToView.description">
              <v-col cols="12">
                <v-divider class="my-4" />
                <h4 class="description-title">{{ $t('chargingProfiles.description') }}:</h4>
                <p class="description-content">{{ profileToView.description }}</p>
              </v-col>
            </v-row>

            <v-row v-if="profileToView.note">
              <v-col cols="12">
                <v-divider class="my-4" />
                <h4 class="note-title">{{ $t('common.note') }}:</h4>
                <p class="note-content">{{ profileToView.note }}</p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="detail-actions">
          <v-btn
            color="info"
            variant="outlined"
            v-if="profileToView"
            @click="manageSchedulePeriods(profileToView)"
          >
            <v-icon start>mdi-clock-outline</v-icon>
            {{ $t('chargingProfiles.manageSchedules') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="closeDetailDialog">
            {{ $t('common.close') }}
          </v-btn>
          <v-btn
            color="primary"
            class="pl-4 pr-4"
            variant="flat"
            v-if="profileToView"
            @click="() => {
              openEditDialog(profileToView!)
              closeDetailDialog()
            }"
          >
            <v-icon start>mdi-pencil</v-icon>
            {{ $t('chargingProfiles.editProfile') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card class="delete-dialog">
        <v-card-title class="delete-title">
          <v-icon color="error" start>mdi-delete</v-icon>
          {{ $t('chargingProfiles.deleteProfile') }}
        </v-card-title>

        <v-card-text>
          {{
            $t('chargingProfiles.confirmDelete', {
              description: profileToDelete?.description || 'this profile'
            })
          }}
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDeleteDialog"
            :disabled="chargingProfilesStore.loading"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="chargingProfilesStore.loading"
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
import { useRouter } from 'vue-router'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useChargePointsStore } from '@/stores/chargepoints'
import EnhancedDataGrid from '@/components/EnhancedDataGrid.vue'
import ExpandableDataRow from '@/components/ExpandableDataRow.vue'
import TabbedChildView from '@/components/TabbedChildView.vue'
import ChargingProfileForm from '@/components/ChargingProfileForm.vue'
import { useHierarchicalData } from '@/composables/useHierarchicalData'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import type {
  ChargingProfile,
  CreateChargingProfileRequest,
  UpdateChargingProfileRequest,
  ChargingProfileFilters
} from '@/types/chargingprofiles'
import type { SchedulePeriod } from '@/types/scheduleperiods'

const chargingProfilesStore = useChargingProfilesStore()
const chargePointsStore = useChargePointsStore()
const schedulePeriodsStore = useSchedulePeriodsStore()
const { t, locale } = useI18n()
const router = useRouter()

// Reactive state
const selectedItems = ref<ChargingProfile[]>([])
const selectionLoading = ref(false)
const deleteLoading = ref(false)
const deleteProgress = ref(0)
const selectedChargingProfile = ref<ChargingProfile | null>(null)
const profileToDelete = ref<ChargingProfile | null>(null)
const profileToView = ref<ChargingProfile | null>(null)
const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)
const successMessage = ref('')
const showSuccessAlert = ref(false)
const batchToolbarRef = ref()
const batchDeleteLoading = ref(false)
const batchDeleteProgress = ref(0)
const currentDeleteIndex = ref(0)

// Set up hierarchical data management for schedule periods
const {
  expandedItems,
  childrenData,
  loadingStates,
  errorStates,
  toggleExpansion,
  loadChildren,
  hasChildren,
  getChildren,
  isLoading,
  getError
} = useHierarchicalData({
  childDataFetcher: async (profile: ChargingProfile) => {
    if (schedulePeriodsStore.schedulePeriods.length === 0) {
      await schedulePeriodsStore.fetchSchedulePeriods()
    }
    return schedulePeriodsStore.getSchedulePeriodsByProfileId(profile.id || 0)
  },
  childDataKey: 'id'
})

// Filters
const filters = reactive<ChargingProfileFilters>({
  search: '',
  charge_point_id: undefined
})

// Table headers
const headers = computed(() => [
  { title: t('chargingProfiles.profileId'), key: 'id', sortable: true, width: '80px' },
  { title: t('chargingProfiles.chargePoint'), key: 'charge_point_id', sortable: true },
  { title: t('chargingProfiles.stackLevel'), key: 'stack_level', sortable: true, width: '100px' },
  { title: t('chargingProfiles.purpose'), key: 'charging_profile_purpose', sortable: true },
  { title: t('chargingProfiles.kind'), key: 'charging_profile_kind', sortable: true },
  { title: t('chargingProfiles.validFrom'), key: 'valid_from', sortable: true },
  { title: t('chargingProfiles.validTo'), key: 'valid_to', sortable: true },
  {
    title: t('chargingProfiles.duration'),
    key: 'duration_in_seconds',
    sortable: true,
    width: '120px'
  },
  {
    title: t('chargingProfiles.minRate'),
    key: 'min_charging_rate',
    sortable: true,
    width: '120px'
  },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '200px' }
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
      title: t('chargingProfiles.profileId'),
      width: 80,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'charge_point_id',
      title: t('chargingProfiles.chargePoint'),

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'stack_level',
      title: t('chargingProfiles.stackLevel'),
      width: 100,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'charging_profile_purpose',
      title: t('chargingProfiles.purpose'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'charging_profile_kind',
      title: t('chargingProfiles.kind'),

      sortable: true,
      type: 'text' as const
    },
    {
      key: 'valid_from',
      title: t('chargingProfiles.validFrom'),

      sortable: true,
      type: 'date' as const
    },
    {
      key: 'valid_to',
      title: t('chargingProfiles.validTo'),

      sortable: true,
      type: 'date' as const
    },
    {
      key: 'duration_in_seconds',
      title: t('chargingProfiles.duration'),
      width: 120,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'min_charging_rate',
      title: t('chargingProfiles.minRate'),
      width: 120,

      sortable: true,
      type: 'number' as const
    },
    {
      key: 'actions',
      title: t('common.actions'),
      width: 200,
      sortable: false,
      type: 'text' as const,
      filterable: false
    }
  ]
})

// Computed properties
const filteredChargingProfiles = computed(() => {
  const cleanFilters = {
    search: filters.search || '',
    charge_point_id: filters.charge_point_id
  }
  return chargingProfilesStore.filteredChargingProfiles(cleanFilters)
})

// Methods
const getStackLevelColor = (stackLevel: number): string => {
  if (stackLevel === 0) return 'error' // Highest priority
  if (stackLevel <= 2) return 'warning'
  return 'info'
}

const getPurposeColor = (purpose: string): string => {
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

const getKindColor = (kind: string): string => {
  switch (kind) {
    case 'Absolute':
      return 'error'
    case 'Recurring':
      return 'primary'
    case 'Relative':
      return 'warning'
    default:
      return 'grey'
  }
}

const getChargePointName = (chargePointId: number): string => {
  const chargePoint = chargePointsStore.getChargePointById(chargePointId)
  return chargePoint?.ocpp_charge_box_id || `CP ${chargePointId}`
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Data retrieval methods for hierarchical view
const getSchedulePeriods = (profile: ChargingProfile) => {
  return getChildren(profile)?.schedulePeriods || []
}

const getSchedulePeriodsCount = (profile: ChargingProfile) => {
  return getSchedulePeriods(profile).length
}

const navigateToSchedulePeriods = (): void => {
  router.push('/schedule-periods')
}

const manageSchedulePeriods = (profile: ChargingProfile): void => {
  // Navigate to schedule periods with profile filter
  router.push(`/schedule-periods?profile=${profile.id}`)
}

const openCreateDialog = (): void => {
  selectedChargingProfile.value = null
  showFormDialog.value = true
}

const openEditDialog = (profile: ChargingProfile): void => {
  selectedChargingProfile.value = profile
  showFormDialog.value = true
}

const closeFormDialog = (): void => {
  selectedChargingProfile.value = null
  showFormDialog.value = false
}

const openDetailDialog = (profile: ChargingProfile): void => {
  profileToView.value = profile
  showDetailDialog.value = true
}

const closeDetailDialog = (): void => {
  profileToView.value = null
  showDetailDialog.value = false
}

const openDeleteDialog = (profile: ChargingProfile): void => {
  profileToDelete.value = profile
  showDeleteDialog.value = true
}

const closeDeleteDialog = (): void => {
  profileToDelete.value = null
  showDeleteDialog.value = false
}

const handleFormSubmit = async (
  data: CreateChargingProfileRequest | UpdateChargingProfileRequest
): Promise<void> => {
  let success = false
  const isEdit = 'id' in data

  try {
    if (isEdit) {
      success = await chargingProfilesStore.updateChargingProfile(
        data as UpdateChargingProfileRequest
      )
      if (success) {
        closeFormDialog()
        showSuccessMessage(
          t('chargingProfiles.updated', { description: data.description || 'profile' })
        )
      }
    } else {
      success = await chargingProfilesStore.createChargingProfile(
        data as CreateChargingProfileRequest
      )
      if (success) {
        closeFormDialog()
        showSuccessMessage(
          t('chargingProfiles.created', { description: data.description || 'profile' })
        )
      }
    }
  } catch (error) {
    console.error('Form submit error:', error)
    showErrorMessage(
      t(isEdit ? 'messages.updateError' : 'messages.createError', {
        item: t('chargingProfiles.profile')
      })
    )
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!profileToDelete.value?.id) return

  try {
    const profileDescription = profileToDelete.value.description || 'profile'
    const success = await chargingProfilesStore.deleteChargingProfile(profileToDelete.value.id)

    if (success) {
      closeDeleteDialog()
      showSuccessMessage(t('chargingProfiles.deleted', { description: profileDescription }))
    }
  } catch (error) {
    console.error('Delete error:', error)
    showErrorMessage(t('messages.deleteError', { item: t('chargingProfiles.profile') }))
  }
}

// Export functions
const exportToPDF = async (): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = filteredChargingProfiles.value.map((profile) => ({
      ID: profile.id || '-',
      'Charge Point': getChargePointName(profile.charge_point_id),
      'Stack Level': profile.stack_level,
      Purpose: t(`chargingProfiles.purpose${profile.charging_profile_purpose}`),
      Kind: t(`chargingProfiles.kind${profile.charging_profile_kind}`),
      'Valid From': formatDateTime(profile.valid_from),
      'Valid To': formatDateTime(profile.valid_to),
      Duration: profile.duration_in_seconds ? formatDuration(profile.duration_in_seconds) : '-',
      'Min Rate': profile.min_charging_rate ? `${profile.min_charging_rate} kW` : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Charging Profiles Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Profiles: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 25, 15, 20, 20, 25, 25, 20, 20]
    const headers = [
      'ID',
      'Charge Point',
      'Stack',
      'Purpose',
      'Kind',
      'Valid From',
      'Valid To',
      'Duration',
      'Min Rate'
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
        const text = String(value).substring(0, 18)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `charging_profiles_export_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportToExcel = async (): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = filteredChargingProfiles.value.map((profile) => ({
      'Profile ID': profile.id || '',
      'Charge Point': getChargePointName(profile.charge_point_id),
      'Stack Level': profile.stack_level,
      Purpose: t(`chargingProfiles.purpose${profile.charging_profile_purpose}`),
      Kind: t(`chargingProfiles.kind${profile.charging_profile_kind}`),
      Recurrency: profile.recurrency_kind
        ? t(`chargingProfiles.recurrency${profile.recurrency_kind}`)
        : '',
      'Valid From': formatDateTime(profile.valid_from),
      'Valid To': formatDateTime(profile.valid_to),
      Duration: profile.duration_in_seconds ? formatDuration(profile.duration_in_seconds) : '',
      'Min Charging Rate (kW)': profile.min_charging_rate || '',
      Description: profile.description || '',
      Note: profile.note || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 12 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 }
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Charging Profiles')

    wb.Props = {
      Title: 'Charging Profiles Export',
      Subject: 'OCPP Charging Profiles Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `charging_profiles_export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportToCSV = async (): Promise<void> => {
  try {
    const headers = [
      'Profile ID',
      'Charge Point',
      'Stack Level',
      'Purpose',
      'Kind',
      'Valid From',
      'Valid To',
      'Duration',
      'Min Rate (kW)',
      'Description'
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    filteredChargingProfiles.value.forEach((profile) => {
      const row = [
        `"${profile.id || ''}"`,
        `"${getChargePointName(profile.charge_point_id).replace(/"/g, '""')}"`,
        `"${profile.stack_level}"`,
        `"${t(`chargingProfiles.purpose${profile.charging_profile_purpose}`)}"`,
        `"${t(`chargingProfiles.kind${profile.charging_profile_kind}`)}"`,
        `"${formatDateTime(profile.valid_from)}"`,
        `"${formatDateTime(profile.valid_to)}"`,
        `"${profile.duration_in_seconds ? formatDuration(profile.duration_in_seconds) : ''}"`,
        `"${profile.min_charging_rate || ''}"`,
        `"${(profile.description || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `charging_profiles_export_${new Date().toISOString().split('T')[0]}.csv`
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
  chargingProfilesStore.error = message
}

// Batch selection methods
const clearSelection = (): void => {
  selectedItems.value = []
}

const handleBatchDelete = async (items: ChargingProfile[]): Promise<void> => {
  if (items.length === 0) return

  batchDeleteLoading.value = true
  currentDeleteIndex.value = 0
  batchDeleteProgress.value = 0
  let successCount = 0
  let failedCount = 0
  const failedItems: string[] = []

  try {
    for (let i = 0; i < items.length; i++) {
      const profile = items[i]
      currentDeleteIndex.value = i + 1
      batchDeleteProgress.value = ((i + 1) / items.length) * 100

      try {
        if (profile.id) {
          const success = await chargingProfilesStore.deleteChargingProfile(profile.id)
          if (success) {
            successCount++
            selectedItems.value = selectedItems.value.filter((item) => item.id !== profile.id)
          } else {
            failedCount++
            failedItems.push(profile.description || `Profile ${profile.id}`)
          }
        } else {
          failedCount++
          failedItems.push(profile.description || `Profile ${profile.id}`)
        }
      } catch (error) {
        console.error(`Failed to delete charging profile ${profile.id}:`, error)
        failedCount++
        failedItems.push(profile.description || `Profile ${profile.id}`)
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
  const selectedProfiles = selectedItems.value

  try {
    switch (format) {
      case 'pdf':
        exportSelectedToPDF(selectedProfiles)
        break
      case 'excel':
        exportSelectedToExcel(selectedProfiles)
        break
      case 'csv':
        exportSelectedToCSV(selectedProfiles)
        break
    }
  } catch (error) {
    console.error('Batch export error:', error)
    showErrorMessage(t('messages.batchExportError'))
  }
}

// Export methods for selected charging profiles
const exportSelectedToPDF = async (selectedProfiles: ChargingProfile[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')

    const exportData = selectedProfiles.map((profile) => ({
      ID: profile.id || '-',
      'Charge Point': getChargePointName(profile.charge_point_id),
      Stack: profile.stack_level,
      Purpose: t(`chargingProfiles.purpose${profile.charging_profile_purpose}`),
      Kind: t(`chargingProfiles.kind${profile.charging_profile_kind}`),
      'Valid From': formatDateTime(profile.valid_from),
      'Valid To': formatDateTime(profile.valid_to),
      Duration: profile.duration_in_seconds ? formatDuration(profile.duration_in_seconds) : '-'
    }))

    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Selected Charging Profiles Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Selected Profiles: ${exportData.length}`, 20, 35)

    let yPos = 50
    const rowHeight = 8
    const colWidths = [15, 25, 12, 18, 15, 25, 25, 20]
    const headers = [
      'ID',
      'Charge Point',
      'Stack',
      'Purpose',
      'Kind',
      'Valid From',
      'Valid To',
      'Duration'
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
        const text = String(value).substring(0, 18)
        pdf.text(text, xPos, yPos)
        xPos += colWidths[index]
      })

      yPos += rowHeight
    })

    const filename = `selected_charging_profiles_export_${
      new Date().toISOString().split('T')[0]
    }.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportSelectedToExcel = async (selectedProfiles: ChargingProfile[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')

    const exportData = selectedProfiles.map((profile) => ({
      'Profile ID': profile.id || '',
      'Charge Point': getChargePointName(profile.charge_point_id),
      'Stack Level': profile.stack_level,
      Purpose: t(`chargingProfiles.purpose${profile.charging_profile_purpose}`),
      Kind: t(`chargingProfiles.kind${profile.charging_profile_kind}`),
      'Valid From': formatDateTime(profile.valid_from),
      'Valid To': formatDateTime(profile.valid_to),
      Duration: profile.duration_in_seconds ? formatDuration(profile.duration_in_seconds) : '',
      'Min Rate (kW)': profile.min_charging_rate || '',
      Description: profile.description || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 12 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 }
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Selected Profiles')

    wb.Props = {
      Title: 'Selected Charging Profiles Export',
      Subject: 'OCPP Selected Charging Profiles Data',
      Author: 'OCPP Frontend',
      CreatedDate: new Date()
    }

    const filename = `selected_charging_profiles_export_${
      new Date().toISOString().split('T')[0]
    }.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportSelectedToCSV = async (selectedProfiles: ChargingProfile[]): Promise<void> => {
  try {
    const headers = [
      'Profile ID',
      'Charge Point',
      'Stack Level',
      'Purpose',
      'Kind',
      'Valid From',
      'Valid To',
      'Duration',
      'Min Rate (kW)',
      'Description'
    ]
    const csvRows = []

    csvRows.push(headers.join(','))

    selectedProfiles.forEach((profile) => {
      const row = [
        `"${profile.id || ''}"`,
        `"${getChargePointName(profile.charge_point_id).replace(/"/g, '""')}"`,
        `"${profile.stack_level}"`,
        `"${t(`chargingProfiles.purpose${profile.charging_profile_purpose}`)}"`,
        `"${t(`chargingProfiles.kind${profile.charging_profile_kind}`)}"`,
        `"${formatDateTime(profile.valid_from)}"`,
        `"${formatDateTime(profile.valid_to)}"`,
        `"${profile.duration_in_seconds ? formatDuration(profile.duration_in_seconds) : ''}"`,
        `"${profile.min_charging_rate || ''}"`,
        `"${(profile.description || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const FileSaver = await import('file-saver')

    const filename = `selected_charging_profiles_export_${
      new Date().toISOString().split('T')[0]
    }.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

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
const handleSelectionChange = (newSelection: ChargingProfile[]) => {
  selectedItems.value = newSelection
}

const handleDeleteSelected = async (items: ChargingProfile[]) => {
  if (items.length === 0) return

  deleteLoading.value = true
  deleteProgress.value = 0

  try {
    let successCount = 0
    let failedCount = 0
    const failedItems: string[] = []

    for (let i = 0; i < items.length; i++) {
      const profile = items[i]
      deleteProgress.value = Math.round((i / items.length) * 100)

      try {
        if (profile.id) {
          const success = await chargingProfilesStore.deleteChargingProfile(profile.id)
          if (success) {
            successCount++
            // Remove from selectedItems immediately
            selectedItems.value = selectedItems.value.filter((item) => item.id !== profile.id)
          } else {
            failedCount++
            failedItems.push(profile.description || `Profile ${profile.id}`)
          }
        } else {
          failedCount++
          failedItems.push(profile.description || `Profile ${profile.id}`)
        }
      } catch (error) {
        console.error(`Failed to delete charging profile ${profile.id}:`, error)
        failedCount++
        failedItems.push(profile.description || `Profile ${profile.id}`)
      }
    }

    deleteProgress.value = 100

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
    console.error('Delete selected error:', error)
    showErrorMessage(t('messages.deleteSelectedFailed'))
  } finally {
    deleteLoading.value = false
    deleteProgress.value = 0
  }
}

const handleExportSelected = (format: 'pdf' | 'excel' | 'csv', items: ChargingProfile[]) => {
  selectionLoading.value = true

  try {
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
  } catch (error) {
    console.error('Export selected error:', error)
    showErrorMessage(t('messages.exportSelectedFailed'))
  } finally {
    selectionLoading.value = false
  }
}

const handleRowClick = (item: any) => {
  console.log('Row clicked:', item)
}

// Export methods for filtered charging profiles
const exportFilteredToPDF = async (filteredProfiles: any[]): Promise<void> => {
  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF('l', 'mm', 'a4')

    pdf.setFontSize(16)
    pdf.text('Filtered Charging Profiles Export Report', 20, 20)

    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30)
    pdf.text(`Total Items: ${filteredProfiles.length}`, 20, 35)

    const filename = `filtered_charging_profiles_export_${
      new Date().toISOString().split('T')[0]
    }.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    showErrorMessage(t('messages.exportPdfError'))
  }
}

const exportFilteredToExcel = async (filteredProfiles: any[]): Promise<void> => {
  try {
    const XLSX = await import('xlsx')
    const exportData = filteredProfiles.map((profile) => ({
      'Profile ID': profile.id || '',
      'Charge Point': getChargePointName(profile.charge_point_id),
      'Stack Level': profile.stack_level,
      Purpose: profile.charging_profile_purpose,
      Kind: profile.charging_profile_kind,
      'Valid From': profile.valid_from ? formatDate(profile.valid_from) : '',
      'Valid To': profile.valid_to ? formatDate(profile.valid_to) : '',
      'Duration (seconds)': profile.duration_in_seconds,
      'Min Charging Rate': profile.min_charging_rate
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Charging Profiles')

    const filename = `filtered_charging_profiles_export_${
      new Date().toISOString().split('T')[0]
    }.xlsx`
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    showErrorMessage(t('messages.exportExcelError'))
  }
}

const exportFilteredToCSV = async (filteredProfiles: any[]): Promise<void> => {
  try {
    const headers = [
      'Profile ID',
      'Charge Point',
      'Stack Level',
      'Purpose',
      'Kind',
      'Valid From',
      'Valid To',
      'Duration (seconds)',
      'Min Charging Rate'
    ]
    const csvRows = [headers.join(',')]

    filteredProfiles.forEach((profile) => {
      const row = [
        `"${profile.id || ''}"`,
        `"${getChargePointName(profile.charge_point_id).replace(/"/g, '""')}"`,
        `"${profile.stack_level}"`,
        `"${profile.charging_profile_purpose}"`,
        `"${profile.charging_profile_kind}"`,
        `"${profile.valid_from ? formatDate(profile.valid_from) : ''}"`,
        `"${profile.valid_to ? formatDate(profile.valid_to) : ''}"`,
        `"${profile.duration_in_seconds}"`,
        `"${profile.min_charging_rate}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const FileSaver = await import('file-saver')

    const filename = `filtered_charging_profiles_export_${
      new Date().toISOString().split('T')[0]
    }.csv`
    FileSaver.saveAs(blob, filename)
  } catch (error) {
    console.error('CSV export error:', error)
    showErrorMessage(t('messages.exportCsvError'))
  }
}

// Additional helper methods
const addSchedulePeriodToProfile = (profile: ChargingProfile) => {
  // Navigate to schedule periods with profile filter and create action
  router.push(`/schedule-periods?profile=${profile.id}&action=create`)
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      chargingProfilesStore.fetchChargingProfiles(),
      chargePointsStore.chargePoints.length === 0
        ? chargePointsStore.fetchChargePoints()
        : Promise.resolve(),
      schedulePeriodsStore.schedulePeriods.length === 0
        ? schedulePeriodsStore.fetchSchedulePeriods()
        : Promise.resolve()
    ])
  } catch (error) {
    console.error('Failed to load charging profiles data:', error)
  }
})
</script>

<style scoped>
.charging-profiles-container {
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

.manage-schedules-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  min-height: 40px;
  overflow: hidden;
}

.manage-schedules-btn .btn-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

@media (max-width: 960px) {
  .manage-schedules-btn .btn-text {
    font-size: 0.75rem;
  }
}

@media (max-width: 600px) {
  .manage-schedules-btn {
    min-height: 36px;
  }

  .manage-schedules-btn .btn-text {
    font-size: 0.7rem;
  }
}

.charging-profile-detail-dialog .detail-title {
  color: rgb(var(--v-theme-info));
  font-weight: 600;
  padding: 20px 24px 16px;
}

.charging-profile-detail-dialog .label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
}

.charging-profile-detail-dialog .value {
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 4px;
}

.charging-profile-detail-dialog .description-title,
.charging-profile-detail-dialog .note-title {
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.charging-profile-detail-dialog .description-content,
.charging-profile-detail-dialog .note-content {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.5;
  margin: 0;
}

.charging-profile-detail-dialog .detail-actions {
  padding: 16px 24px 24px;
}

.delete-dialog .delete-title {
  color: rgb(var(--v-theme-error));
  font-weight: 600;
}

/* Hierarchical View Styles */
.hierarchical-view {
  padding: 16px;
}

.profile-row-container {
  margin-bottom: 16px;
}

.profile-parent-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-outline));
}

.profile-info {
  flex: 1;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.profile-description {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.profile-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
}

.detail-icon {
  color: rgb(var(--v-theme-primary));
}

.profile-actions {
  display: flex;
  gap: 4px;
}

.schedule-periods-section {
  margin-top: 16px;
}

.schedule-periods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
}

.schedule-period-card {
  background: rgb(var(--v-theme-background));
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s ease;
}

.schedule-period-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.period-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.period-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.empty-message {
  margin: 8px 0 16px 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
}

.add-period-btn {
  margin-top: 8px;
}

.view-toggle-btn {
  margin-right: 8px;
}

@media (max-width: 960px) {
  .charging-profiles-container {
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

  .schedule-periods-grid {
    grid-template-columns: 1fr;
  }

  .profile-parent-content {
    flex-direction: column;
    gap: 12px;
  }

  .profile-actions {
    align-self: flex-end;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Hierarchical expanded content styles */
.expanded-content-wrapper {
  background: rgb(var(--v-theme-surface-container));
  border-radius: 0 0 8px 8px;
}

.child-items-container {
  background: transparent;
}

.child-item-card {
  transition: all 0.2s ease;
  border: 1px solid rgb(var(--v-theme-outline));
  background: rgb(var(--v-theme-surface));
}

.child-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary));
}

.child-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Dark theme improvements */
.v-theme--dark .expanded-content-wrapper {
  background: rgb(var(--v-theme-surface-container));
}

.v-theme--dark .child-item-card {
  background: rgb(var(--v-theme-surface-bright));
  border-color: rgb(var(--v-theme-outline-variant));
}

.v-theme--dark .child-item-card:hover {
  background: rgb(var(--v-theme-surface-container-high));
}
</style>
