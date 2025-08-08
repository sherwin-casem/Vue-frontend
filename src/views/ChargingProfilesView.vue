<!-- @ts-nocheck -->

<template>
  <div class="chargingprofiles-management">
    <v-card elevation="2">
      <v-card-title class="chargingprofiles-header">
        <h1 class="text-h4">
          {{ $t('chargingprofiles.title') }}
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('chargingprofiles.manageAllChargingProfiles') }}
        </p>
      </v-card-title>

      <v-card-text>
        <div class="action-bar">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            :disabled="chargingProfilesStore.loading"
            @click="openCreateDialog"
          >
            {{ $t('chargingprofiles.addChargingProfile') }}
          </v-btn>

          <v-spacer />

          <div class="search-container">
            <v-text-field
              v-model="globalSearch"
              prepend-icon="mdi-magnify"
              :label="$t('common.search')"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="search-field"
            />
          </div>

          <v-menu>
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-export"
                v-bind="props"
                :disabled="!chargingProfiles.length || chargingProfilesStore.loading"
                class="export-btn"
              >
                {{ $t('export.export') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="exportToPdf">
                <v-list-item-title>
                  <v-icon start> mdi-file-pdf-box </v-icon>
                  {{ $t('export.exportToPdf') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToExcel">
                <v-list-item-title>
                  <v-icon start> mdi-file-excel </v-icon>
                  {{ $t('export.exportToExcel') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportToCsv">
                <v-list-item-title>
                  <v-icon start> mdi-file-delimited </v-icon>
                  {{ $t('export.exportToCsv') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-menu>
            <template #activator="{ props }">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-view-column"
                v-bind="props"
                class="column-selector-btn"
              >
                {{ $t('common.selectColumns') }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="column in allColumns"
                :key="column.field"
                :disabled="column.required"
                @click="toggleColumn(column.field)"
              >
                <template #prepend>
                  <v-checkbox
                    :model-value="column.visible"
                    :disabled="column.required"
                    hide-details
                    @click.stop="toggleColumn(column.field)"
                  />
                </template>
                <v-list-item-title>{{ column.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            variant="text"
            icon="mdi-refresh"
            :loading="chargingProfilesStore.loading"
            @click="refreshData"
          />
        </div>

        <v-alert
          v-if="chargingProfilesStore.error"
          type="error"
          variant="tonal"
          closable
          class="error-alert"
          @click:close="chargingProfilesStore.clearError"
        >
          {{ chargingProfilesStore.error }}
        </v-alert>

        <v-alert
          v-if="showSuccessAlert"
          type="success"
          variant="tonal"
          closable
          class="success-alert"
          @click:close="showSuccessAlert = false"
        >
          {{ successMessage }}
        </v-alert>

        <div class="grid-container">
          <KendoLocalizationProvider :language="kendoLocale">
            <KendoIntlProvider :locale="kendoLocale.split('-')[0]">
              <Grid
                ref="kendoGrid"
                :key="gridKey"
                :data-items="result.data || []"
                :total="result.total || 0"
                :columns="columnsWithSelection"
                :style="{ height: '500px' }"
                :sortable="true"
                :pageable="pageableConfig"
                :groupable="true"
                :group="group"
                :take="take"
                :skip="skip"
                :reorderable="true"
                :loading="chargingProfilesStore.loading || schedulePeriodsStore.loading"
                :disabled="chargingProfilesStore.loading || schedulePeriodsStore.loading"
                :selected-field="selectedField"
                :filterable="false"
                class="chargingprofiles-grid"
                :filter="dataState.filter"
                :sort="dataState.sort"
                :detail="cellTemplate"
                :expand-field="'expanded'"
                @datastatechange="dataStateChange"
                @selectionchange="onSelectionChange"
                @headerselectionchange="onHeaderSelectionChange"
                @rowclick="onRowClick"
                @expandchange="expandChange"
                @columnreorder="columnReorder"
                :loader="chargingProfilesStore.loading"
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

                <template #detailTemplate="{ props }">
                  <div v-if="props.dataItem._loadingPeriods" class="loading-container">
                    <v-progress-circular indeterminate color="primary" size="24" />
                  </div>

                  <TabStrip
                    v-else
                    :selected="getRowTabState(props.dataItem.id)"
                    :tabs="tabs"
                    @select="(e) => onSelect(e, props.dataItem.id)"
                  >
                    <template #details>
                      <ChargingProfileDetailView
                        :charging-profile="props.dataItem"
                        :full-view="true"
                        @edit="openEditDialog"
                        @delete="confirmDelete"
                      />
                    </template>
                    <template #chargepoint>
                      <div v-if="props.dataItem._chargePoint" class="chargepoint-details">
                        <ChargePointDetailView
                          :charge-point="props.dataItem._chargePoint"
                          :full-view="true"
                        />
                      </div>
                      <div v-else class="no-data-message">
                        {{ $t('chargingprofiles.noChargePointData') }}
                      </div>
                    </template>

                    <template #scheduleperiods>
                      <div class="schedule-periods-header">
                        <v-btn
                          size="small"
                          color="primary"
                          variant="elevated"
                          prepend-icon="mdi-plus"
                          @click="addSchedulePeriod(props.dataItem)"
                        >
                          {{ $t('scheduleperiods.addSchedulePeriod') }}
                        </v-btn>
                      </div>
                      <div
                        v-if="
                          props.dataItem._schedulePeriods &&
                          props.dataItem._schedulePeriods.length > 0
                        "
                      >
                        <Grid
                          :columns="schedulePeriodsColumns"
                          :data-items="props.dataItem._schedulePeriods"
                          :sortable="true"
                          :sort="schedulePeriodsSort"
                          :filterable="false"
                          :messages="messages"
                          @sortchange="schedulePeriodsSortChangeHandler"
                        >
                          <template #schedulePeriodActionTemplate="{ props: periodProps }">
                            <ActionCell
                              :data-item="periodProps.dataItem"
                              @actionselect="handleSchedulePeriodAction"
                            />
                          </template>
                        </Grid>
                      </div>
                      <div v-else class="no-data-message">
                        {{ $t('chargingprofiles.noSchedulePeriodData') }}
                      </div>
                    </template>
                    <template #connectors>
                      <Grid
                        :columns="connectorsColumns"
                        :data-items="props.dataItem._connectors || []"
                        :sortable="true"
                        :sort="connectorsSort"
                        :groupable="false"
                        :filterable="false"
                        :messages="messages"
                        @sortchange="connectorsSortChangeHandler"
                      />
                    </template>
                  </TabStrip>
                </template>

                <template #actionTemplate="{ props }">
                  <ActionCell :data-item="props.dataItem" @actionselect="handleRowAction" />
                </template>
              </Grid>
            </KendoIntlProvider>
          </KendoLocalizationProvider>

          <div v-if="selectedGridChargingProfile" class="grid-row-actions">
            <v-chip class="selected-indicator" color="primary" variant="outlined">
              {{ $t('chargingprofiles.chargingProfile') }}: {{ selectedGridChargingProfile.id }}
            </v-chip>

            <div class="action-buttons">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(selectedGridChargingProfile)"
              >
                {{ $t('common.edit') }}
              </v-btn>

              <v-btn
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(selectedGridChargingProfile)"
              >
                {{ $t('common.delete') }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditing
              ? $t('chargingprofiles.editChargingProfile')
              : $t('chargingprofiles.createNewChargingProfile')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="chargingProfileForm"
            v-model="formValid"
            @submit.prevent="saveChargingProfile"
          >
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.charge_point_id"
                  :label="$t('chargingprofiles.chargePoint')"
                  :items="availableChargePoints"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                  :no-data-text="$t('chargingprofiles.noChargePointsAvailable')"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.stack_level"
                  :label="$t('chargingprofiles.stackLevel')"
                  :placeholder="$t('forms.stackLevelPlaceholder')"
                  :rules="[rules.required, rules.stackLevelRange]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.charging_profile_purpose"
                  :label="$t('chargingprofiles.purpose')"
                  :items="purposeOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.charging_profile_kind"
                  :label="$t('chargingprofiles.kind')"
                  :items="kindOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-select
                  v-model="currentChargingProfile.recurrency_kind"
                  :label="$t('chargingprofiles.recurrencyKind')"
                  :items="recurrencyOptions"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.min_charging_rate"
                  :label="$t('chargingprofiles.minChargingRate')"
                  :placeholder="$t('forms.minChargingRatePlaceholder')"
                  :rules="[rules.minChargingRateRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                />
              </v-col>

              <v-col cols="6">
                <FormattedDateTimeInput
                  v-model="currentChargingProfile.valid_from"
                  :label="$t('chargingprofiles.validFrom')"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <FormattedDateTimeInput
                  v-model="currentChargingProfile.valid_to"
                  :label="$t('chargingprofiles.validTo')"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentChargingProfile.duration_in_seconds"
                  :label="$t('chargingprofiles.durationInSeconds')"
                  :placeholder="$t('forms.durationPlaceholder')"
                  :rules="[rules.durationRange]"
                  variant="outlined"
                  type="number"
                />
              </v-col>

              <v-col cols="6">
                <FormattedDateTimeInput
                  v-model="currentChargingProfile.start_schedule"
                  :label="$t('chargingprofiles.startSchedule')"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="currentChargingProfile.description"
                  :label="$t('chargingprofiles.description')"
                  :placeholder="$t('forms.descriptionPlaceholder')"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="currentChargingProfile.note"
                  :label="$t('common.note')"
                  :placeholder="$t('forms.notePlaceholder')"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="chargingProfilesStore.loading"
            :disabled="!formValid"
            @click="saveChargingProfile"
          >
            {{ isEditing ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">
          {{ $t('chargingprofiles.deleteChargingProfile') }}
        </v-card-title>
        <v-card-text>
          {{ $t('chargingprofiles.confirmDelete', { id: selectedChargingProfile?.id || '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="chargingProfilesStore.loading"
            @click="deleteChargingProfile"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Schedule Period Dialog -->
    <v-dialog v-model="schedulePeriodDialogOpen" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{
            isEditingSchedulePeriod
              ? $t('scheduleperiods.editSchedulePeriod')
              : $t('scheduleperiods.createNewSchedulePeriod')
          }}</span>
        </v-card-title>

        <v-card-text>
          <v-form
            ref="schedulePeriodForm"
            v-model="schedulePeriodFormValid"
            @submit.prevent="saveSchedulePeriod"
          >
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="currentSchedulePeriod.start_period_in_seconds"
                  :label="$t('scheduleperiods.startPeriodInSeconds')"
                  :placeholder="$t('forms.startPeriodPlaceholder')"
                  :rules="[rules.required, rules.startPeriodNumeric]"
                  variant="outlined"
                  type="number"
                  required
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="currentSchedulePeriod.limit"
                  :label="$t('scheduleperiods.limit')"
                  :placeholder="$t('forms.limitPlaceholder')"
                  :rules="[rules.required, rules.limitRange]"
                  variant="outlined"
                  type="number"
                  step="0.1"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="currentSchedulePeriod.number_phases"
                  :label="$t('scheduleperiods.numberPhases')"
                  :items="phaseOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeSchedulePeriodDialog">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="schedulePeriodsStore.loading"
            :disabled="!schedulePeriodFormValid"
            @click="saveSchedulePeriod"
          >
            {{ isEditingSchedulePeriod ? $t('common.update') : $t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialogOpen" max-width="900px" persistent>
      <v-card v-if="viewedChargingProfile" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary"> mdi-chart-line </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('chargingprofiles.chargingProfile') }} {{ viewedChargingProfile.id }}
              </h2>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="close-btn"
            @click="detailDialogOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider" />

        <v-card-text class="detail-content">
          <ChargingProfileDetailView :charging-profile="viewedChargingProfile" :full-view="true" />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="confirmDelete(viewedChargingProfile)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="openEditDialog(viewedChargingProfile)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Schedule Period Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model="schedulePeriodDeleteDialogOpen"
      :title="$t('scheduleperiods.deleteSchedulePeriod')"
      :message="$t('scheduleperiods.confirmDelete', { id: selectedSchedulePeriod?.id || '' })"
      :loading="schedulePeriodsStore.loading"
      @confirm="deleteSchedulePeriodConfirmed"
      @cancel="schedulePeriodDeleteDialogOpen = false"
    />

    <!-- Schedule Period Detail Dialog -->
    <v-dialog v-model="schedulePeriodDetailDialogOpen" max-width="900px" persistent>
      <v-card v-if="viewedSchedulePeriodChild" class="modern-detail-card">
        <v-card-title class="detail-card-header">
          <div class="header-content">
            <v-icon class="header-icon" size="28" color="primary"> mdi-calendar-clock </v-icon>
            <div class="header-text">
              <h2 class="header-title">
                {{ $t('scheduleperiods.schedulePeriod') }} {{ viewedSchedulePeriodChild.id }}
              </h2>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="close-btn"
            @click="schedulePeriodDetailDialogOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="header-divider" />

        <v-card-text class="detail-content">
          <SchedulePeriodDetailView
            :schedule-period="viewedSchedulePeriodChild"
            :full-view="true"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="detail-actions">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-delete"
            class="action-btn"
            @click="deleteSchedulePeriod(viewedSchedulePeriodChild)"
          >
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            prepend-icon="mdi-pencil"
            class="action-btn"
            @click="editSchedulePeriod(viewedSchedulePeriodChild)"
          >
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectionToolbar
      :selected-count="selectedCount"
      :loading="chargingProfilesStore.loading"
      @export-selected="exportSelectedChargingProfiles"
      @delete-selected="deleteSelectedChargingProfiles"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Grid, filterGroupByField } from '@progress/kendo-vue-grid'
import { useKendoGridGlobalization } from '@/composables/useKendoGridGlobalization'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useSchedulePeriodsStore } from '@/stores/scheduleperiods'
import type {
  ChargingProfile,
  CreateChargingProfileRequest,
  UpdateChargingProfileRequest
} from '@/types/chargingprofiles'
import { useKendoGridTranslations } from '@/composables/useKendoGridTranslations'
import { capitalizeFirst, ExportUtils } from '@/utils/exportUtils'
import type { ExportColumn } from '@/utils/exportUtils'
import ColumnMenu from '@/components/columnMenu.vue'
import ChargingProfileDetailView from '@/components/ChargingProfileDetailView.vue'
import ChargePointDetailView from '@/components/ChargePointDetailView.vue'
import SchedulePeriodDetailView from '@/components/SchedulePeriodDetailView.vue'
import SelectionToolbar from '@/components/SelectionToolbar.vue'
import ActionCell from '@/components/ActionCell.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import FormattedDateTimeInput from '@/components/FormattedDateTimeInput.vue'
import { process } from '@progress/kendo-data-query'
import '@/utils/resizeObserverFix'
import { TabStrip } from '@progress/kendo-vue-layout'
import { formatDateTime } from '@/utils/dateUtils'
import { VChip } from 'vuetify/components'

const { t, locale } = useI18n()
const { kendoLocale, KendoLocalizationProvider, KendoIntlProvider } = useKendoGridGlobalization()

// Grid messages are now handled by the globalization composable
const chargingProfilesStore = useChargingProfilesStore()
const chargePointsStore = useChargePointsStore()
const schedulePeriodsStore = useSchedulePeriodsStore()
const selectedField = 'selected'
const cellTemplate = ref('detailTemplate')
const viewedChargingProfile = ref<ChargingProfile | null>(null)
const detailDialogOpen = ref(false)
const dialogOpen = ref(false)
const selected = ref(0)
const rowTabStates = ref(new Map())

const deleteDialogOpen = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const selectedChargingProfile = ref<ChargingProfile | null>(null)
const selectedGridChargingProfile = ref<ChargingProfile | null>(null)
const chargingProfileForm = ref()

// Schedule Period dialog state
const schedulePeriodDialogOpen = ref(false)
const schedulePeriodDeleteDialogOpen = ref(false)
const schedulePeriodFormValid = ref(false)
const isEditingSchedulePeriod = ref(false)
const selectedSchedulePeriod = ref<any>(null)
const selectedChargingProfileForPeriod = ref<ChargingProfile | null>(null)
const schedulePeriodForm = ref()

const kendoGrid = ref()
const group = ref([])
const result = ref([])
const gridKey = ref(0)
const globalSearch = ref('')
const schedulePeriodsSort = ref([])
const connectorsSort = ref([])

// Child detail dialogs
const schedulePeriodDetailDialogOpen = ref(false)
const viewedSchedulePeriodChild = ref<any>(null)

const schedulePeriodsSortChangeHandler = (e) => {
  schedulePeriodsSort.value = e.sort
}

const connectorsSortChangeHandler = (e) => {
  connectorsSort.value = e.sort
}
const successMessage = ref('')
const showSuccessAlert = ref(false)
const forceGridRefresh = () => gridKey.value++

const dataState = ref({
  take: 8,
  skip: 0
})
const skip = ref(0)
const take = ref(10)

const currentChargingProfile = reactive<Partial<ChargingProfile>>({
  charge_point_id: undefined,
  stack_level: 0,
  charging_profile_purpose: 'TxDefault',
  charging_profile_kind: 'Absolute',
  recurrency_kind: undefined,
  valid_from: '',
  valid_to: '',
  duration_in_seconds: undefined,
  start_schedule: undefined,
  min_charging_rate: undefined,
  description: '',
  note: ''
})

const currentSchedulePeriod = reactive<any>({
  charging_profile_id: undefined,
  start_period_in_seconds: undefined,
  limit: undefined,
  number_phases: 1
})

const chargingProfiles = computed(() => chargingProfilesStore.chargingProfiles)

const selectedChargingProfiles = computed(() =>
  chargingProfiles.value.filter((profile) => profile.selected === true)
)

const selectedCount = computed(() => selectedChargingProfiles.value.length)

const filteredChargingProfiles = computed(() => {
  if (!globalSearch.value) {
    return chargingProfiles.value
  }

  const searchTerm = globalSearch.value.toLowerCase()
  return chargingProfiles.value.filter(
    (profile) =>
      profile.charge_point_id?.toString().includes(searchTerm) ||
      profile.charging_profile_purpose?.toLowerCase().includes(searchTerm) ||
      profile.charging_profile_kind?.toLowerCase().includes(searchTerm) ||
      profile.description?.toLowerCase().includes(searchTerm) ||
      profile.note?.toLowerCase().includes(searchTerm)
  )
})

const pageableConfig = {
  buttonCount: 5,
  pageSizes: [10, 20, 50, 100],
  pageSize: 20
}

const tabs = ref([
  { title: t('common.details'), content: 'details' },
  { title: t('chargepoints.title'), content: 'chargepoint' },
  { title: t('scheduleperiods.title'), content: 'scheduleperiods' }
])

const purposeOptions = [
  { value: 'TxDefault', title: 'Tx Default' },
  { value: 'TxProfile', title: 'Tx Profile' },
  { value: 'TxMaxProfile', title: 'Tx Max Profile' }
]

const kindOptions = [
  { value: 'Absolute', title: t('chargingprofiles.kindAbsolute') },
  { value: 'Recurring', title: t('chargingprofiles.kindRecurring') },
  { value: 'Relative', title: t('chargingprofiles.kindRelative') }
]

const recurrencyOptions = [
  { value: 'Daily', title: t('chargingprofiles.recurrencyDaily') },
  { value: 'Weekly', title: t('chargingprofiles.recurrencyWeekly') }
]

const phaseOptions = [
  { value: 1, title: t('scheduleperiods.onePhase') },
  { value: 2, title: t('scheduleperiods.twoPhases') },
  { value: 3, title: t('scheduleperiods.threePhases') }
]

const availableChargePoints = computed(() =>
  chargePointsStore.chargePoints.map((cp) => ({
    value: cp.id,
    title: `${cp.ocpp_charge_box_id} (${cp.manufacturer} ${cp.model})`
  }))
)

const schedulePeriodsColumns = [
  {
    field: 'start_period_in_seconds',
    title: t('scheduleperiods.startPeriodInSeconds')
  },
  {
    field: 'limit',
    title: t('scheduleperiods.limit')
  },
  {
    field: 'number_phases',
    title: t('scheduleperiods.numberPhases')
  },
  {
    title: t('common.actions'),
    cell: 'schedulePeriodActionTemplate',
    width: '120px'
  }
]
// All available columns with visibility control
const allColumns = ref([
  {
    field: 'id',
    title: t('chargingprofiles.id'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'charge_point_id',
    title: t('chargingprofiles.chargePointId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    required: true
  },
  {
    field: 'charge_point.ocpp_charge_box_id',
    title: t('chargepoints.ocppChargeBoxId'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'stack_level',
    title: t('chargingprofiles.stackLevel'),
    filter: 'numeric',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'charging_profile_purpose',
    title: t('chargingprofiles.purpose'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true
  },
  {
    field: 'charging_profile_kind',
    title: t('chargingprofiles.kind'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    cell: (h, td, props) => {
     if(props.dataItem.charging_profile_kind){
       return h('td', {}, t(`chargingprofiles.kind${capitalizeFirst(props.dataItem?.charging_profile_kind)}`))
     }
     else{
      return ''
     }
    }
  },
   {
    field: 'recurrency_kind',
    title: t('chargingprofiles.recurrencyKind'),
    filter: 'text',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    cell: (h, td, props) => {
      if(props.dataItem.recurrency_kind) {
        return h ('td', {}, t(`chargingprofiles.recurrency${capitalizeFirst(props.dataItem?.recurrency_kind)}`))
      }else {
        return ''
      }
    }
  },
  {
    field: 'valid_from',
    title: t('chargingprofiles.validFrom'),
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: true,
    cell: (h, td, props) => {
      const userLocale = navigator.language || 'en-US'
      return h('td', {}, formatDateTime(props.dataItem.valid_from, userLocale))
    }
  },
  {
    field: 'valid_to',
    title: t('chargingprofiles.validTo'),
    filter: 'date',
    columnMenu: 'columnMenuTemplate',
    headerClassName: 'customMenu',
    visible: false,
    cell: (h, td, props) => {
      const userLocale = navigator.language || 'en-US'
      return h('td', {}, formatDateTime(props.dataItem.valid_to, userLocale))
    }
  },
  {
    field: 'actions',
    title: t('common.actions'),
    cell: 'actionTemplate',
    visible: true,
    filterable: false,
    sortable: false
  }
])

const getPurposeColor = (purpose: string) => {
  switch (purpose) {
    case 'TxDefault':
      return 'primary'
    case 'TxProfile':
      return 'success'
    case 'TxMaxProfile':
      return 'warning'
    default:
      return 'default'
  }
}

const getKindColor = (kind: string) => {
  switch (kind) {
    case 'Absolute':
      return 'info'
    case 'Recurring':
      return 'secondary'
    case 'Relative':
      return 'accent'
    default:
      return 'default'
  }
}

// Default visible columns
const defaultVisibleColumns = [
  'charge_point_id',
  'stack_level',
  'charging_profile_purpose',
  'charging_profile_kind',
  'valid_from'
]

// Computed visible columns
const staticColumns = computed(() => {
  return allColumns.value.filter((col) => col.visible)
})

const areAllSelected = computed(
  () => filteredChargingProfiles.value.findIndex((item) => item.selected === false) === -1
)

const columns = computed(() => staticColumns.value)

const columnsWithSelection = computed(() => [
  { field: 'selected', width: '50px', headerSelectionValue: areAllSelected.value },
  ...columns.value
])

// Function to toggle column visibility
const toggleColumn = (field: string) => {
  const column = allColumns.value.find((col) => col.field === field)
  if (column && !column.required) {
    column.visible = !column.visible
  }
}

const onSelect = (e, rowId) => {
  if (rowId) {
    rowTabStates.value.set(rowId, e.selected)
  } else {
    selected.value = e.selected
  }
}

const getRowTabState = (rowId) => {
  return rowTabStates.value.get(rowId) || 0
}

const rules = {
  required: (value: string | number) =>
    (value !== null && value !== undefined && value !== '') || t('validation.fieldRequired'),
  chargePointIdNumeric: (value: number) =>
    (!isNaN(value) && value > 0) || t('chargingprofiles.validation.chargePointIdNumeric'),
  stackLevelRange: (value: number) =>
    (value >= 0 && value <= 99) || t('chargingprofiles.validation.stackLevelRange'),
  minChargingRateRange: (value: number) =>
    !value || (value > 0 && value <= 1000) || t('chargingprofiles.validation.minChargingRateRange'),
  durationRange: (value: number) =>
    !value || (value > 0 && value <= 86400) || t('chargingprofiles.validation.durationRange'),
  startPeriodNumeric: (value: number) =>
    (!isNaN(value) && value >= 0) || t('scheduleperiods.validation.startPeriodNumeric'),
  limitRange: (value: number) =>
    (value > 0 && value <= 1000) || t('scheduleperiods.validation.limitRange')
}

function handleRowAction({ dataItem, action }) {
  switch (action) {
    case 'view':
      viewChargingProfile(dataItem)
      break
    case 'update':
      openEditDialog(dataItem)
      break
    case 'delete':
      confirmDelete(dataItem)
      break
  }
}

function handleSchedulePeriodAction({ dataItem, action }) {
  switch (action) {
    case 'view':
      viewedSchedulePeriodChild.value = dataItem
      schedulePeriodDetailDialogOpen.value = true
      break
    case 'update':
      editSchedulePeriod(dataItem)
      break
    case 'delete':
      deleteSchedulePeriod(dataItem)
      break
  }
}

function createAppState(dataState) {
  group.value = dataState.group
  take.value = dataState.take
  skip.value = dataState.skip
  // refreshData()
}

// Focus management for pagination - handled via CSS and natural browser behavior

const columnReorder = (options: any) => {
  // Handle column reordering while maintaining visibility state
  const newColumnOrder = options.columns.filter((col: any) => col.field !== 'selected')
  const reorderedColumns = newColumnOrder.map((newCol: any) => {
    const existingCol = allColumns.value.find((col) => col.field === newCol.field)
    return existingCol ? { ...existingCol, ...newCol } : newCol
  })

  // Update allColumns with new order
  allColumns.value = reorderedColumns
}

async function expandChange(event) {
  event.dataItem[event.target.$props.expandField] = event.value

  // Fetch schedule periods and charge point when expanding a charging profile
  if (event.value && event.dataItem.id) {
    // Set loading state
    event.dataItem._loadingPeriods = true
    try {
      // Fetch schedule periods and charge point data in parallel
      const [periods, chargePoint] = await Promise.all([
        schedulePeriodsStore.fetchSchedulePeriodsByChargingProfileId(event.dataItem.id),
        chargePointsStore.getChargePointById(event.dataItem.charge_point_id)
      ])

      // Store data in the specific row's data item
      event.dataItem._schedulePeriods = periods
      event.dataItem._chargePoint = chargePoint
    } catch (error) {
      console.error('Error fetching related data:', error)
      event.dataItem._schedulePeriods = []
      event.dataItem._chargePoint = null
    } finally {
      event.dataItem._loadingPeriods = false
    }
  } else if (!event.value) {
    // Clear data when collapsing
    event.dataItem._schedulePeriods = []
    event.dataItem._chargePoint = null
    event.dataItem._loadingPeriods = false
    // Clear tab state for this row
    rowTabStates.value.delete(event.dataItem.id)
  }
}

const createDataState = (state) => {
  if (filteredChargingProfiles.value && filteredChargingProfiles.value.length > 0) {
    result.value = process(filteredChargingProfiles.value.slice(0), state)
  } else {
    result.value = { data: [], total: 0 }
  }
  dataState.value = state
}

const dataStateChange = (e) => {
  // Check if this is a filter change (not pagination or sorting)
  const isFilterChange =
    e.event && (e.event.type === 'filter' || e.data.filter !== dataState.value.filter)

  if (e.event) {
    const isColumnActive = filterGroupByField(e.event.field, e.data.filter)
    const changedColumn = columns.value.find((column) => column.field === e.event.field)

    if (changedColumn) {
      changedColumn.headerClassName = isColumnActive ? 'customMenu active' : ''
    }

    // Clear selection only for filter changes, not pagination/sorting
    if (isFilterChange) {
      clearSelection()
    }
  }
  createAppState(e.data)
  createDataState(e.data)
}

const onColumnsSubmit = (columnsState: any[]) => {
  // Update the visible columns based on the column menu state
  const visibleFields = columnsState.map((col) => col.field)
  allColumns.value = allColumns.value.map((col) => ({
    ...col,
    visible: visibleFields.includes(col.field)
  }))
}

const refreshData = async () => {
  await Promise.all([
    chargingProfilesStore.fetchChargingProfiles(),
    chargePointsStore.fetchChargePoints(),
    schedulePeriodsStore.fetchSchedulePeriods()
  ])
  chargingProfilesStore.chargingProfiles.forEach((profile) => {
    if (!profile.hasOwnProperty('selected')) {
      profile.selected = false
    }
  })
}

const openCreateDialog = () => {
  isEditing.value = false
  resetForm()
  dialogOpen.value = true
}

const viewChargingProfile = (profile: ChargingProfile) => {
  viewedChargingProfile.value = profile
  detailDialogOpen.value = true
}

const openEditDialog = (profile: ChargingProfile) => {
  isEditing.value = true
  Object.assign(currentChargingProfile, {
    ...profile,
    // Keep dates as ISO strings for FormattedDateTimeInput
    valid_from: profile.valid_from || '',
    valid_to: profile.valid_to || '',
    start_schedule: profile.start_schedule || ''
  })
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(currentChargingProfile, {
    charge_point_id: undefined,
    stack_level: 0,
    charging_profile_purpose: 'TxDefault',
    charging_profile_kind: 'Absolute',
    recurrency_kind: undefined,
    valid_from: '',
    valid_to: '',
    duration_in_seconds: undefined,
    start_schedule: undefined,
    min_charging_rate: undefined,
    description: '',
    note: ''
  })
  if (chargingProfileForm.value) {
    chargingProfileForm.value.resetValidation()
  }
}

const saveChargingProfile = async () => {
  if (!chargingProfileForm.value?.validate()) return

  const profileData = {
    charge_point_id: Number(currentChargingProfile.charge_point_id!),
    stack_level: Number(currentChargingProfile.stack_level!),
    charging_profile_purpose: currentChargingProfile.charging_profile_purpose! as
      | 'TxDefault'
      | 'TxProfile'
      | 'TxMaxProfile',
    charging_profile_kind: currentChargingProfile.charging_profile_kind! as
      | 'Absolute'
      | 'Recurring'
      | 'Relative',
    recurrency_kind: currentChargingProfile.recurrency_kind as 'Daily' | 'Weekly' | undefined,
    valid_from: currentChargingProfile.valid_from
      ? new Date(currentChargingProfile.valid_from)
      : new Date(),
    valid_to: currentChargingProfile.valid_to
      ? new Date(currentChargingProfile.valid_to)
      : new Date(),
    duration_in_seconds: currentChargingProfile.duration_in_seconds
      ? Number(currentChargingProfile.duration_in_seconds)
      : undefined,
    start_schedule: currentChargingProfile.start_schedule
      ? new Date(currentChargingProfile.start_schedule)
      : undefined,
    min_charging_rate: currentChargingProfile.min_charging_rate
      ? Number(currentChargingProfile.min_charging_rate)
      : undefined,
    description: currentChargingProfile.description || '',
    note: currentChargingProfile.note || ''
  }

  let success = false

  if (isEditing.value && currentChargingProfile.id) {
    const updateData: UpdateChargingProfileRequest = {
      ...profileData,
      id: currentChargingProfile.id
    }
    success = await chargingProfilesStore.updateChargingProfile(updateData)
    if (success) {
      successMessage.value = t('chargingprofiles.updated', { id: currentChargingProfile.id })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    const createData: CreateChargingProfileRequest = profileData
    success = await chargingProfilesStore.createChargingProfile(createData)
    if (success) {
      successMessage.value = t('chargingprofiles.created', { id: 'Profile' })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeDialog()
    detailDialogOpen.value = false
    viewedChargingProfile.value = null
  }
}

const confirmDelete = (profile: ChargingProfile) => {
  selectedChargingProfile.value = profile
  deleteDialogOpen.value = true
}

const deleteChargingProfile = async () => {
  if (selectedChargingProfile.value?.id) {
    const profileId = selectedChargingProfile.value.id
    const success = await chargingProfilesStore.deleteChargingProfile(
      selectedChargingProfile.value.id
    )
    if (success) {
      successMessage.value = t('chargingprofiles.deleted', { id: profileId })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
      deleteDialogOpen.value = false
      detailDialogOpen.value = false
      selectedChargingProfile.value = null
      selectedGridChargingProfile.value = null
      viewedChargingProfile.value = null
      refreshData()
    }
  }
}

const clearSelection = () => {
  chargingProfilesStore.chargingProfiles = chargingProfilesStore.chargingProfiles.map((item) => ({
    ...item,
    selected: false
  }))
}

const deleteSelectedChargingProfiles = async () => {
  const selectedIds = selectedChargingProfiles.value
    .map((p) => p.id)
    .filter((id) => id !== undefined)

  if (selectedIds.length === 0) return

  let allSuccess = true
  for (const id of selectedIds) {
    const success = await chargingProfilesStore.deleteChargingProfile(id!)
    if (!success) allSuccess = false
  }

  if (allSuccess) {
    clearSelection()
    refreshData()
  }
}

const exportSelectedChargingProfiles = async (format: 'pdf' | 'excel' | 'csv') => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    const exportOptions = {
      data: selectedChargingProfiles.value,
      columns,
      title: t('chargingprofiles.selectedChargingProfiles'),
      filename: `selected_chargingprofiles_${new Date().toISOString().split('T')[0]}`
    }

    switch (format) {
      case 'pdf':
        await ExportUtils.exportToPDF({
          ...exportOptions,
          filename: exportOptions.filename + '.pdf'
        })
        break
      case 'excel':
        await ExportUtils.exportToExcel({
          ...exportOptions,
          filename: exportOptions.filename + '.xlsx'
        })
        break
      case 'csv':
        await ExportUtils.exportToCSV({
          ...exportOptions,
          filename: exportOptions.filename + '.csv'
        })
        break
    }
  } catch (error) {
    console.error('Selected export error:', error)
  }
}

function onHeaderSelectionChange(event) {
  const checked = event.event.target.checked
  // Get the IDs of filtered/visible items
  const filteredIds = new Set(filteredChargingProfiles.value.map((item) => item.id))

  // Only update selection for filtered items
  chargingProfilesStore.chargingProfiles = chargingProfilesStore.chargingProfiles.map((item) => ({
    ...item,
    selected: filteredIds.has(item.id) ? checked : item.selected
  }))
}
function onSelectionChange(event) {
  event.dataItem[selectedField] = !event.dataItem[selectedField]
}
function onRowClick(event) {
  // const nativeEvent = event.event;
  // let target = nativeEvent?.target;
  // if (!target) return;
  // while (target && target.nodeType !== 1) {
  //   target = target.parentNode;
  // }
  // const isHierarchyClick =
  //   target.closest('.k-hierarchy-cell') || target.closest('.k-i-expand') || target.closest('.k-icon');
  // const isActionClick = target.closest('.action-column') || target.closest('button') || target.closest('input[type="checkbox"]');
  // if (isHierarchyClick || isActionClick) {
  //   return;
  // }
  // if (event.dataItem && !event.dataItem.aggregates) {
  //   viewChargingProfile(event.dataItem);
  // }
}

const exportToPdf = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    await ExportUtils.exportToPDF({
      data: filteredChargingProfiles.value,
      columns,
      title: t('chargingprofiles.title'),
      filename: `chargingprofiles_${new Date().toISOString().split('T')[0]}.pdf`
    })
  } catch (error) {
    console.error('PDF export error:', error)
  }
}

const exportToExcel = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    await ExportUtils.exportToExcel({
      data: filteredChargingProfiles.value,
      columns,
      title: t('chargingprofiles.title'),
      filename: `chargingprofiles_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  } catch (error) {
    console.error('Excel export error:', error)
  }
}

const exportToCsv = async () => {
  try {
    const columns: ExportColumn[] = [
      { key: 'id', title: t('chargingprofiles.id'), type: 'number' },
      { key: 'charge_point_id', title: t('chargingprofiles.chargePointId'), type: 'number' },
      { key: 'stack_level', title: t('chargingprofiles.stackLevel'), type: 'number' },
      { key: 'charging_profile_purpose', title: t('chargingprofiles.purpose'), type: 'text' },
      { key: 'charging_profile_kind', title: t('chargingprofiles.kind'), type: 'text' },
      { key: 'valid_from', title: t('chargingprofiles.validFrom'), type: 'date' },
      { key: 'valid_to', title: t('chargingprofiles.validTo'), type: 'date' }
    ]

    await ExportUtils.exportToCSV({
      data: filteredChargingProfiles.value,
      columns,
      title: t('chargingprofiles.title'),
      filename: `chargingprofiles_${new Date().toISOString().split('T')[0]}.csv`
    })
  } catch (error) {
    console.error('CSV export error:', error)
  }
}

const addSchedulePeriod = (chargingProfile: any) => {
  selectedChargingProfileForPeriod.value = chargingProfile
  isEditingSchedulePeriod.value = false
  resetSchedulePeriodForm()
  currentSchedulePeriod.charging_profile_id = chargingProfile.id
  schedulePeriodDialogOpen.value = true
}

const editSchedulePeriod = (schedulePeriod: any) => {
  selectedSchedulePeriod.value = schedulePeriod
  isEditingSchedulePeriod.value = true
  Object.assign(currentSchedulePeriod, schedulePeriod)
  schedulePeriodDialogOpen.value = true
}

const deleteSchedulePeriod = async (schedulePeriod: any) => {
  selectedSchedulePeriod.value = schedulePeriod
  schedulePeriodDeleteDialogOpen.value = true
}

const deleteSchedulePeriodConfirmed = async () => {
  if (selectedSchedulePeriod.value?.id) {
    try {
      const success = await schedulePeriodsStore.deleteSchedulePeriod(
        selectedSchedulePeriod.value.id
      )
      if (success) {
        successMessage.value = t('scheduleperiods.deleted', { id: selectedSchedulePeriod.value.id })
        showSuccessAlert.value = true
        setTimeout(() => {
          showSuccessAlert.value = false
        }, 5000)
        schedulePeriodDeleteDialogOpen.value = false

        // Refresh the expanded row data
        if (selectedChargingProfileForPeriod.value) {
          try {
            const periods = await schedulePeriodsStore.fetchSchedulePeriodsByChargingProfileId(
              selectedChargingProfileForPeriod.value.id
            )
            selectedChargingProfileForPeriod.value._schedulePeriods = periods
          } catch (error) {
            console.error('Error refreshing schedule periods:', error)
          }
        }

        selectedSchedulePeriod.value = null
        // Only refresh schedule periods data instead of entire grid
        await schedulePeriodsStore.fetchSchedulePeriods()
      } else {
        schedulePeriodDeleteDialogOpen.value = false
      }
    } catch (error) {
      console.error('Error deleting schedule period:', error)
      schedulePeriodDeleteDialogOpen.value = false
    }
  }
}

const closeSchedulePeriodDialog = () => {
  schedulePeriodDialogOpen.value = false
  resetSchedulePeriodForm()
}

const resetSchedulePeriodForm = () => {
  Object.assign(currentSchedulePeriod, {
    charging_profile_id: undefined,
    start_period_in_seconds: undefined,
    limit: undefined,
    number_phases: 1
  })
  if (schedulePeriodForm.value) {
    schedulePeriodForm.value.resetValidation()
  }
}

const saveSchedulePeriod = async () => {
  if (!schedulePeriodForm.value?.validate()) return

  const periodData = {
    charging_profile_id: Number(currentSchedulePeriod.charging_profile_id!),
    start_period_in_seconds: Number(currentSchedulePeriod.start_period_in_seconds!),
    limit: Number(currentSchedulePeriod.limit!),
    number_phases: Number(currentSchedulePeriod.number_phases!)
  }

  let success = false

  if (isEditingSchedulePeriod.value && selectedSchedulePeriod.value?.id) {
    const updateData = {
      ...periodData,
      id: selectedSchedulePeriod.value.id
    }
    success = await schedulePeriodsStore.updateSchedulePeriod(updateData)
    if (success) {
      successMessage.value = t('scheduleperiods.updated', { id: selectedSchedulePeriod.value.id })
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  } else {
    success = await schedulePeriodsStore.createSchedulePeriod(periodData)
    if (success) {
      successMessage.value = t('scheduleperiods.created')
      showSuccessAlert.value = true
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    }
  }

  if (success) {
    closeSchedulePeriodDialog()
    // Refresh the expanded row data
    if (selectedChargingProfileForPeriod.value) {
      try {
        const periods = await schedulePeriodsStore.fetchSchedulePeriodsByChargingProfileId(
          selectedChargingProfileForPeriod.value.id
        )
        selectedChargingProfileForPeriod.value._schedulePeriods = periods
      } catch (error) {
        console.error('Error refreshing schedule periods:', error)
      }
    }
    // Only refresh schedule periods data instead of entire grid
    await schedulePeriodsStore.fetchSchedulePeriods()
  }
}

onMounted(() => {
  createDataState({
    take: 8,
    skip: 0
  })
})

onMounted(async () => {
  await refreshData()
  createDataState({
    take: 8,
    skip: 0
  })
})

watch(
  filteredChargingProfiles,
  (newValue) => {
    // Reset pagination when filtered data changes
    const newDataState = {
      ...dataState.value,
      skip: 0
    }
    createDataState(newDataState)
  },
  { immediate: true }
)

watch(globalSearch, () => {
  // Reset pagination and selection when search changes
  clearSelection()
  const newDataState = {
    ...dataState.value,
    skip: 0
  }
  createDataState(newDataState)
})
</script>

<style scoped>
.chargingprofiles-management {
  padding: 16px;
}

.chargingprofiles-header {
  padding: 24px 24px 16px 24px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-container {
  min-width: 250px;
}

.search-field {
  max-width: 300px;
}

.export-actions {
  display: flex;
  gap: 8px;
}

.chargingprofiles-grid .k-grid-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chargingprofiles-grid .k-grid-table tbody tr:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.export-btn {
  font-size: 0.875rem;
}

.column-selector-btn {
  font-size: 0.875rem;
}

.error-alert,
.success-alert {
  margin-bottom: 16px;
}

.grid-container {
  margin-top: 16px;
}

.chargingprofiles-grid {
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

.action-buttons-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding: 8px 0;
}

.action-btn {
  margin: 0 2px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn .v-icon {
  font-size: 18px;
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

  .search-container {
    min-width: auto;
  }
}

@media (max-width: 600px) {
  .chargingprofiles-management {
    padding: 8px;
  }

  .chargingprofiles-header {
    padding: 16px;
  }

  .export-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons-cell {
    flex-direction: column;
    align-items: center;
  }
}

th.k-header.customMenu > div > div > span.k-i-more-vertical::before,
th.k-header.customMenu.active > div > div > span.k-i-more-vertical::before {
  content: '\e129';
}

.k-columnmenu-item {
  display: none;
}

/* Modern Detail Dialog Styles */
.modern-detail-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12),
    0 11px 15px -7px rgba(0, 0, 0, 0.2) !important;
}

.detail-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px 20px;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 4px 0 0;
  font-weight: 400;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.header-divider {
  border-color: rgba(255, 255, 255, 0.12);
  margin: 0;
}

.detail-content {
  padding: 32px !important;
  background-color: var(--dialog-content-bg);
  min-height: 200px;
}

.detail-actions {
  padding: 20px 32px 24px !important;
  background-color: var(--dialog-content-bg);
  gap: 12px;
}

.action-btn {
  border-radius: 8px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  padding: 0 20px !important;
  height: 44px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  background: #fafafa;
}

.loading-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.chargepoint-details {
  padding: 16px;
}

.no-data-message {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.schedule-periods-header {
  padding: 16px;
  border-bottom: 1px solid var(--v-border-color);
  background-color: var(--v-theme-surface-variant);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
