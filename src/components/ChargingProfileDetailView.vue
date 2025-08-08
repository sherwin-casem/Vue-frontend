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
      <span class="detail-value">{{ chargingProfile.charging_profile_purpose }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.kind') }}:</span>

      <span class="detail-value">{{ t(`chargingprofiles.kind${capitalizeFirst(chargingProfile?.charging_profile_kind)}`) }}</span>

    </div>

    <div v-if="chargingProfile.recurrency_kind" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.recurrencyKind') }}:</span>
      <span class="detail-value">{{t(`chargingprofiles.recurrency${capitalizeFirst(chargingProfile?.recurrency_kind)}`) }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.validFrom') }}:</span>
      <span class="detail-value">{{
        formatDateTime(chargingProfile.valid_from, userLocale.value)
      }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.validTo') }}:</span>
      <span class="detail-value">{{
        formatDateTime(chargingProfile.valid_to, userLocale.value)
      }}</span>
    </div>

    <div v-if="chargingProfile.duration_in_seconds" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.durationInSeconds') }}:</span>
      <span class="detail-value">{{ chargingProfile.duration_in_seconds }}s</span>
    </div>

    <div v-if="chargingProfile.start_schedule" class="detail-row">
      <span class="detail-label">{{ $t('chargingprofiles.startSchedule') }}:</span>
      <span class="detail-value">{{
        formatDateTime(chargingProfile.start_schedule, userLocale.value)
      }}</span>
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
      <span class="detail-value">{{
        formatDateTime(chargingProfile.created_at, userLocale.value)
      }}</span>
    </div>

    <div v-if="chargingProfile.updated_at" class="detail-row">
      <span class="detail-label">{{ $t('common.updated') }}:</span>
      <span class="detail-value">{{
        formatDateTime(chargingProfile.updated_at, userLocale.value)
      }}</span>
    </div>

    <div v-if="!fullView" class="detail-actions">
      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-eye"
        class="detail-btn"
        @click="$emit('view', chargingProfile)"
      >
        {{ $t('common.view') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-pencil"
        class="detail-btn"
        @click="$emit('edit', chargingProfile)"
      >
        {{ $t('common.edit') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        color="error"
        prepend-icon="mdi-delete"
        class="detail-btn"
        @click="$emit('delete', chargingProfile)"
      >
        {{ $t('common.delete') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ChargingProfile } from '@/types/chargingprofiles'
import { formatDateTime } from '@/utils/dateUtils'
import { computed } from 'vue'
import { capitalizeFirst } from '@/utils/exportUtils'

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

const userLocale = computed(() => {
  const browserLocale = navigator.language || 'en-US'
  // Map common locales to proper BCP 47 format
  const localeMap: Record<string, string> = {
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    ru: 'ru-RU'
  }

  // Check if it's already in proper format
  if (browserLocale.includes('-')) {
    return browserLocale
  }

  // Map short locale to full format
  return localeMap[browserLocale] || browserLocale
})

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
  max-height: 400px;
  overflow-y: auto;
  background-color: var(--dialog-content-bg);
  color: var(--text-primary);
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  min-width: 140px;
  color: var(--detail-label-color);
}

.detail-value {
  flex: 1;
  color: var(--text-primary);
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--divider-color);
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
