<template>
  <v-card class="charging-profile-form-card">
    <v-card-title class="form-title">
      <v-icon color="primary" start>mdi-chart-timeline-variant</v-icon>
      {{
        chargingProfile
          ? $t('chargingProfiles.editProfile')
          : $t('chargingProfiles.createNewProfile')
      }}
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-container>
          <v-row>
            <!-- Charge Point Selection -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.charge_point_id"
                :label="$t('chargingProfiles.chargePoint')"
                :items="chargePointOptions"
                item-title="text"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                :loading="chargePointsLoading"
                required
              />
            </v-col>

            <!-- Stack Level (Priority) -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.stack_level"
                :label="$t('chargingProfiles.stackLevel')"
                type="number"
                :rules="[rules.stackLevel]"
                variant="outlined"
                density="compact"
                min="0"
                max="999"
                :hint="$t('chargingProfiles.stackLevelHint')"
                persistent-hint
                required
              />
            </v-col>

            <!-- Charging Profile Purpose -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.charging_profile_purpose"
                :label="$t('chargingProfiles.purpose')"
                :items="purposeOptions"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>

            <!-- Charging Profile Kind -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.charging_profile_kind"
                :label="$t('chargingProfiles.kind')"
                :items="kindOptions"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                required
                @update:model-value="onKindChange"
              />
            </v-col>

            <!-- Recurrency Kind (only for Recurring profiles) -->
            <v-col cols="12" sm="6" v-if="formData.charging_profile_kind === 'Recurring'">
              <v-select
                v-model="formData.recurrency_kind"
                :label="$t('chargingProfiles.recurrencyKind')"
                :items="recurrencyOptions"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>

            <!-- Valid From -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.valid_from"
                :label="$t('chargingProfiles.validFrom')"
                type="datetime-local"
                :rules="[rules.required, rules.validDates]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>

            <!-- Valid To -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.valid_to"
                :label="$t('chargingProfiles.validTo')"
                type="datetime-local"
                :rules="[rules.required, rules.validDates]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>

            <!-- Duration in Seconds (optional) -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.duration_in_seconds"
                :label="$t('chargingProfiles.durationSeconds')"
                type="number"
                :rules="[rules.duration]"
                variant="outlined"
                density="compact"
                min="0"
                suffix="seconds"
                :hint="$t('chargingProfiles.durationHint')"
                persistent-hint
              />
            </v-col>

            <!-- Start Schedule (optional) -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.start_schedule"
                :label="$t('chargingProfiles.startSchedule')"
                type="time"
                variant="outlined"
                density="compact"
                :hint="$t('chargingProfiles.startScheduleHint')"
                persistent-hint
              />
            </v-col>

            <!-- Minimum Charging Rate (optional) -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.min_charging_rate"
                :label="$t('chargingProfiles.minChargingRate')"
                type="number"
                :rules="[rules.minChargingRate]"
                variant="outlined"
                density="compact"
                min="0"
                step="0.1"
                suffix="kW"
              />
            </v-col>

            <!-- Description -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.description"
                :label="$t('chargingProfiles.description')"
                variant="outlined"
                density="compact"
                :placeholder="$t('chargingProfiles.descriptionPlaceholder')"
              />
            </v-col>

            <!-- Note -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.note"
                :label="$t('common.note')"
                variant="outlined"
                density="compact"
                rows="2"
                :placeholder="$t('chargingProfiles.notePlaceholder')"
              />
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
        {{ chargingProfile ? $t('common.update') : $t('common.create') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChargePointsStore } from '@/stores/chargepoints'
import type {
  ChargingProfile,
  CreateChargingProfileRequest,
  UpdateChargingProfileRequest
} from '@/types/chargingprofiles'

interface Props {
  chargingProfile?: ChargingProfile | null
  loading?: boolean
}

interface Emits {
  (e: 'submit', value: CreateChargingProfileRequest | UpdateChargingProfileRequest): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  chargingProfile: null,
  loading: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const chargePointsStore = useChargePointsStore()

// Form reference
const formRef = ref()

// Form data
const formData = ref<CreateChargingProfileRequest>({
  charge_point_id: 0,
  stack_level: 0,
  charging_profile_purpose: 'TxDefault',
  charging_profile_kind: 'Recurring',
  recurrency_kind: 'Daily',
  valid_from: '',
  valid_to: '',
  duration_in_seconds: undefined,
  start_schedule: undefined,
  min_charging_rate: undefined,
  description: '',
  note: ''
})

// Loading state
const chargePointsLoading = computed(() => chargePointsStore.loading)

// Validation rules
const rules = {
  required: (value: any) => !!value || t('validation.fieldRequired'),
  stackLevel: (value: any) => {
    if (value == null || value === '' || value === undefined) return t('validation.fieldRequired')
    const numValue = Number(value)
    if (isNaN(numValue) || numValue < 0) return t('chargingProfiles.validation.stackLevelMin')
    if (numValue > 999) return t('chargingProfiles.validation.stackLevelMax')
    return true
  },
  validDates: () => {
    if (formData.value.valid_from && formData.value.valid_to) {
      const from = new Date(formData.value.valid_from)
      const to = new Date(formData.value.valid_to)
      if (from >= to) return t('chargingProfiles.validation.validToAfterFrom')
    }
    return true
  },
  duration: (value: number) => {
    if (value !== undefined && value <= 0) return t('chargingProfiles.validation.durationPositive')
    return true
  },
  minChargingRate: (value: number) => {
    if (value !== undefined && value <= 0)
      return t('chargingProfiles.validation.minChargingRatePositive')
    return true
  }
}

// Options
const purposeOptions = computed(() => [
  { title: t('chargingProfiles.purposeTxDefault'), value: 'TxDefault' },
  { title: t('chargingProfiles.purposeTxProfile'), value: 'TxProfile' },
  { title: t('chargingProfiles.purposeTxMaxProfile'), value: 'TxMaxProfile' }
])

const kindOptions = computed(() => [
  { title: t('chargingProfiles.kindAbsolute'), value: 'Absolute' },
  { title: t('chargingProfiles.kindRecurring'), value: 'Recurring' },
  { title: t('chargingProfiles.kindRelative'), value: 'Relative' }
])

const recurrencyOptions = computed(() => [
  { title: t('chargingProfiles.recurrencyDaily'), value: 'Daily' },
  { title: t('chargingProfiles.recurrencyWeekly'), value: 'Weekly' }
])

const chargePointOptions = computed(() => {
  return chargePointsStore.chargePoints.map((cp) => ({
    text: `${cp.ocpp_charge_box_id} (${cp.manufacturer} ${cp.model})`,
    value: cp.id
  }))
})

// Methods
const onKindChange = () => {
  if (formData.value.charging_profile_kind !== 'Recurring') {
    formData.value.recurrency_kind = undefined
  } else {
    formData.value.recurrency_kind = 'Daily'
  }
}

// Helper to format datetime for input
const formatDateTimeForInput = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
}

// Helper to convert datetime input to ISO string
const formatDateTimeToISO = (dateString: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toISOString()
}

// Watch for charging profile prop changes
watch(
  () => props.chargingProfile,
  (newProfile) => {
    if (newProfile) {
      formData.value = {
        charge_point_id: newProfile.charge_point_id,
        stack_level: newProfile.stack_level,
        charging_profile_purpose: newProfile.charging_profile_purpose,
        charging_profile_kind: newProfile.charging_profile_kind,
        recurrency_kind: newProfile.recurrency_kind,
        valid_from: formatDateTimeForInput(newProfile.valid_from),
        valid_to: formatDateTimeForInput(newProfile.valid_to),
        duration_in_seconds: newProfile.duration_in_seconds,
        start_schedule: newProfile.start_schedule?.slice(11, 16) || '', // Extract time part
        min_charging_rate: newProfile.min_charging_rate,
        description: newProfile.description || '',
        note: newProfile.note || ''
      }
    } else {
      // Reset form for new profile
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      formData.value = {
        charge_point_id: 0,
        stack_level: 0,
        charging_profile_purpose: 'TxDefault',
        charging_profile_kind: 'Recurring',
        recurrency_kind: 'Daily',
        valid_from: formatDateTimeForInput(now.toISOString()),
        valid_to: formatDateTimeForInput(tomorrow.toISOString()),
        duration_in_seconds: undefined,
        start_schedule: undefined,
        min_charging_rate: undefined,
        description: '',
        note: ''
      }
    }
  },
  { immediate: true }
)

// Form submission
const handleSubmit = async (): Promise<void> => {
  const { valid } = await formRef.value.validate()

  if (!valid) return

  // Convert form data to proper format
  const submitData = {
    ...formData.value,
    valid_from: formatDateTimeToISO(formData.value.valid_from),
    valid_to: formatDateTimeToISO(formData.value.valid_to),
    start_schedule: formData.value.start_schedule
      ? `1970-01-01T${formData.value.start_schedule}:00Z`
      : undefined,
    duration_in_seconds: formData.value.duration_in_seconds || undefined,
    min_charging_rate: formData.value.min_charging_rate || undefined,
    description: formData.value.description || undefined,
    note: formData.value.note || undefined
  }

  if (props.chargingProfile?.id) {
    // Update existing profile
    const updateData: UpdateChargingProfileRequest = {
      id: props.chargingProfile.id,
      ...submitData
    }
    emit('submit', updateData)
  } else {
    // Create new profile
    emit('submit', submitData)
  }
}

// Load charge points on mount
onMounted(async () => {
  if (chargePointsStore.chargePoints.length === 0) {
    await chargePointsStore.fetchChargePoints()
  }
})
</script>

<style scoped>
.charging-profile-form-card {
  max-width: 900px;
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

@media (max-width: 600px) {
  .charging-profile-form-card {
    margin: 16px;
  }

  .form-title {
    font-size: 1.25rem;
  }
}
</style>
