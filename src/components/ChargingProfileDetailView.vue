<template>
  <div class="chargingprofile-detail">
    <div v-if="!fullView" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.id') }}:</span>
      <span class="detail-value">{{ chargingProfile.id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.chargePointId') }}:</span>
      <span class="detail-value">{{ chargingProfile.charge_point_id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.stackLevel') }}:</span>
      <span class="detail-value">{{ chargingProfile.stack_level }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.purpose') }}:</span>
      <v-chip
        :color="getPurposeColor(chargingProfile.charging_profile_purpose)"
        size="small"
        variant="tonal"
      >
        {{ chargingProfile.charging_profile_purpose }}
      </v-chip>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.kind') }}:</span>
      <v-chip
        :color="getKindColor(chargingProfile.charging_profile_kind)"
        size="small"
        variant="tonal"
      >
        {{ chargingProfile.charging_profile_kind }}
      </v-chip>
    </div>

    <div v-if="chargingProfile.recurrency_kind" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.recurrencyKind') }}:</span>
      <span class="detail-value">{{ chargingProfile.recurrency_kind }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.validFrom') }}:</span>
      <span class="detail-value">{{ formatDate(chargingProfile.valid_from) }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.validTo') }}:</span>
      <span class="detail-value">{{ formatDate(chargingProfile.valid_to) }}</span>
    </div>

    <div v-if="chargingProfile.duration_in_seconds" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.durationInSeconds') }}:</span>
      <span class="detail-value">{{ chargingProfile.duration_in_seconds }}s</span>
    </div>

    <div v-if="chargingProfile.start_schedule" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.startSchedule') }}:</span>
      <span class="detail-value">{{ formatDate(chargingProfile.start_schedule) }}</span>
    </div>

    <div v-if="chargingProfile.min_charging_rate" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.minChargingRate') }}:</span>
      <span class="detail-value">{{ chargingProfile.min_charging_rate }} kW</span>
    </div>

    <div v-if="chargingProfile.description" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.description') }}:</span>
      <span class="detail-value">{{ chargingProfile.description }}</span>
    </div>

    <div v-if="chargingProfile.note" class="detail-row">
      <span class="detail-label">{{ $t('common.note') }}:</span>
      <span class="detail-value">{{ chargingProfile.note }}</span>
    </div>

    <div v-if="chargingProfile.created_at" class="detail-row">
      <span class="detail-label">{{ $t('common.created') }}:</span>
      <span class="detail-value">{{ formatDate(chargingProfile.created_at) }}</span>
    </div>

    <div v-if="chargingProfile.updated_at" class="detail-row">
      <span class="detail-label">{{ $t('common.updated') }}:</span>
      <span class="detail-value">{{ formatDate(chargingProfile.updated_at) }}</span>
    </div>

    <div v-if="!fullView" class="detail-actions">
      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-eye"
        @click="$emit('view', chargingProfile)"
        class="detail-btn"
      >
        {{ $t('common.view') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-pencil"
        @click="$emit('edit', chargingProfile)"
        class="detail-btn"
      >
        {{ $t('common.edit') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        color="error"
        prepend-icon="mdi-delete"
        @click="$emit('delete', chargingProfile)"
        class="detail-btn"
      >
        {{ $t('common.delete') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChargingProfile } from '@/types/chargingprofiles'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'

interface Props {
  chargingProfile: ChargingProfile
  fullView?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: [chargingProfile: ChargingProfile]
  delete: [chargingProfile: ChargingProfile]
  view: [chargingProfile: ChargingProfile]
}>()

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()

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
</script>

<style scoped>
.chargingprofile-detail {
  padding: 16px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  min-width: 160px;
  color: rgba(0, 0, 0, 0.6);
}

.detail-value {
  flex: 1;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.detail-btn {
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-label {
    margin-bottom: 4px;
    min-width: auto;
  }

  .detail-actions {
    flex-direction: column;
  }
}
</style>
