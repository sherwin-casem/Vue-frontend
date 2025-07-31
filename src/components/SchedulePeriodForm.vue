<template>
  <v-card class="schedule-period-form-card">
    <v-card-title class="form-title">
      <v-icon color="primary" start>mdi-clock-outline</v-icon>
      {{
        schedulePeriod
          ? $t('schedulePeriods.editSchedulePeriod')
          : $t('schedulePeriods.createNewSchedulePeriod')
      }}
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-container>
          <v-row>
            <!-- Charging Profile Selection -->
            <v-col cols="12">
              <v-select
                v-model="formData.charging_profile_id"
                :label="$t('schedulePeriods.chargingProfile')"
                :items="chargingProfileOptions"
                item-title="text"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                :loading="chargingProfilesLoading"
                required
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.text">
                    <template v-slot:subtitle>
                      <div class="profile-subtitle">
                        <v-chip
                          size="x-small"
                          :color="getPurposeColor(item.raw.purpose)"
                          variant="tonal"
                        >
                          {{ item.raw.purpose }}
                        </v-chip>
                        <span class="ml-2">{{ item.raw.chargePoint }}</span>
                      </div>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- Start Period in Seconds -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.start_period_in_seconds"
                :label="$t('schedulePeriods.startPeriod')"
                type="number"
                :rules="[rules.required, rules.startPeriod]"
                variant="outlined"
                density="compact"
                min="0"
                suffix="seconds"
                :hint="$t('schedulePeriods.startPeriodHint')"
                persistent-hint
                required
              />
            </v-col>

            <!-- Convenient time input for start period -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="timeInput"
                :label="$t('schedulePeriods.startPeriodTime')"
                type="time"
                variant="outlined"
                density="compact"
                :hint="$t('schedulePeriods.timeInputHint')"
                persistent-hint
                @update:model-value="updateSecondsFromTime"
              />
            </v-col>

            <!-- Power Limit -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.limit"
                :label="$t('schedulePeriods.limit')"
                type="number"
                :rules="[rules.required, rules.limit]"
                variant="outlined"
                density="compact"
                min="0.1"
                step="0.1"
                suffix="kW"
                required
              />
            </v-col>

            <!-- Number of Phases -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.number_phases"
                :label="$t('schedulePeriods.numberPhases')"
                :items="phaseOptions"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>

            <!-- Period Duration Helper -->
            <v-col cols="12">
              <v-alert type="info" variant="tonal" class="duration-helper">
                <div class="duration-info">
                  <strong>{{ $t('schedulePeriods.periodInfo') }}:</strong>
                  <div class="mt-2">
                    <div>
                      {{ $t('schedulePeriods.startTime') }}:
                      {{ formatSeconds(formData.start_period_in_seconds) }}
                    </div>
                    <div>{{ $t('schedulePeriods.powerLimit') }}: {{ formData.limit || 0 }} kW</div>
                    <div>
                      {{ $t('schedulePeriods.phases') }}: {{ formData.number_phases }}
                      {{ $t('schedulePeriods.phase', formData.number_phases) }}
                    </div>
                  </div>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>

    <v-card-actions class="form-actions">
      <v-spacer />
      <v-btn variant="text" @click="$emit('cancel')" :disabled="loading">
        {{ $t('common.cancel') }}
      </v-btn>
      <v-btn color="primary" variant="flat" @click="handleSubmit" :loading="loading">
        {{ schedulePeriod ? $t('common.update') : $t('common.create') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChargingProfilesStore } from '@/stores/chargingprofiles'
import { useChargePointsStore } from '@/stores/chargepoints'
import type {
  SchedulePeriod,
  CreateSchedulePeriodRequest,
  UpdateSchedulePeriodRequest
} from '@/types/scheduleperiods'

interface Props {
  schedulePeriod?: SchedulePeriod | null
  loading?: boolean
  preselectedProfileId?: number
}

interface Emits {
  (e: 'submit', value: CreateSchedulePeriodRequest | UpdateSchedulePeriodRequest): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  schedulePeriod: null,
  loading: false,
  preselectedProfileId: undefined
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const chargingProfilesStore = useChargingProfilesStore()
const chargePointsStore = useChargePointsStore()

// Form reference
const formRef = ref()

// Form data
const formData = ref<CreateSchedulePeriodRequest>({
  charging_profile_id: 0,
  start_period_in_seconds: 0,
  limit: 22.0,
  number_phases: 3
})

// Time input helper
const timeInput = ref('')

// Loading state
const chargingProfilesLoading = computed(() => chargingProfilesStore.loading)

// Validation rules
const rules = {
  required: (value: any) => !!value || t('validation.fieldRequired'),
  startPeriod: (value: number) => {
    if (value < 0) return t('schedulePeriods.validation.startPeriodMin')
    if (value > 86400) return t('schedulePeriods.validation.startPeriodMax') // 24 hours
    return true
  },
  limit: (value: number) => {
    if (!value || value <= 0) return t('schedulePeriods.validation.limitMin')
    if (value > 500) return t('schedulePeriods.validation.limitMax')
    return true
  }
}

// Options
const phaseOptions = computed(() => [
  { title: t('schedulePeriods.singlePhase'), value: 1 },
  { title: t('schedulePeriods.twoPhase'), value: 2 },
  { title: t('schedulePeriods.threePhase'), value: 3 }
])

const chargingProfileOptions = computed(() => {
  return chargingProfilesStore.chargingProfiles.map((profile) => {
    const chargePoint = chargePointsStore.getChargePointById(profile.charge_point_id)
    return {
      text: `${profile.description || `Profile ${profile.id}`} (Stack: ${profile.stack_level})`,
      value: profile.id,
      purpose: profile.charging_profile_purpose,
      chargePoint: chargePoint?.ocpp_charge_box_id || `CP ${profile.charge_point_id}`
    }
  })
})

// Methods
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

const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 3600 + minutes * 60
}

const secondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const updateSecondsFromTime = (timeStr: string): void => {
  if (timeStr) {
    formData.value.start_period_in_seconds = timeToSeconds(timeStr)
  }
}

// Watch for schedule period prop changes
watch(
  () => props.schedulePeriod,
  (newPeriod) => {
    if (newPeriod) {
      formData.value = {
        charging_profile_id: newPeriod.charging_profile_id,
        start_period_in_seconds: newPeriod.start_period_in_seconds,
        limit: newPeriod.limit,
        number_phases: newPeriod.number_phases
      }
      timeInput.value = secondsToTime(newPeriod.start_period_in_seconds)
    } else {
      // Reset form for new period
      formData.value = {
        charging_profile_id: props.preselectedProfileId || 0,
        start_period_in_seconds: 0,
        limit: 22.0,
        number_phases: 3
      }
      timeInput.value = '00:00'
    }
  },
  { immediate: true }
)

// Watch for preselected profile
watch(
  () => props.preselectedProfileId,
  (newProfileId) => {
    if (newProfileId && !props.schedulePeriod) {
      formData.value.charging_profile_id = newProfileId
    }
  },
  { immediate: true }
)

// Form submission
const handleSubmit = async (): Promise<void> => {
  const { valid } = await formRef.value.validate()

  if (!valid) return

  if (props.schedulePeriod?.id) {
    // Update existing period
    const updateData: UpdateSchedulePeriodRequest = {
      id: props.schedulePeriod.id,
      ...formData.value
    }
    emit('submit', updateData)
  } else {
    // Create new period
    emit('submit', formData.value)
  }
}

// Load data on mount
onMounted(async () => {
  if (chargingProfilesStore.chargingProfiles.length === 0) {
    await chargingProfilesStore.fetchChargingProfiles()
  }
  if (chargePointsStore.chargePoints.length === 0) {
    await chargePointsStore.fetchChargePoints()
  }
})
</script>

<style scoped>
.schedule-period-form-card {
  max-width: 700px;
  margin: 0 auto;
}

.form-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  padding: 20px 24px 16px;
}

.form-actions {
  padding: 16px 24px 24px;
}

.profile-subtitle {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
}

.duration-helper {
  border-radius: 8px;
}

.duration-info {
  font-size: 0.875rem;
}

@media (max-width: 600px) {
  .schedule-period-form-card {
    margin: 16px;
  }

  .form-title {
    font-size: 1.25rem;
  }
}
</style>
