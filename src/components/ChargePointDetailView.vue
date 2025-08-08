<template>
  <div class="chargepoint-detail">
    <div v-if="!fullView" class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.id') }}:</span>
      <span class="detail-value">{{ chargePoint.id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.ocppChargeBoxId') }}:</span>
      <span class="detail-value">{{ chargePoint.ocpp_charge_box_id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.siteId') }}:</span>
      <span class="detail-value">{{ chargePoint.site_id }}</span>
    </div>

    
    <div class="detail-row">
      <span class="detail-label">{{ $t('sites.siteName') }}:</span>
      <span class="detail-value">{{ chargePoint.site?.name }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.manufacturer') }}:</span>
      <span class="detail-value">{{ chargePoint.manufacturer }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.model') }}:</span>
      <span class="detail-value">{{ chargePoint.model }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.connectorCount') }}:</span>
      <span class="detail-value">{{ chargePoint.connector_count }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('chargepoints.status') }}:</span>
      <v-chip :color="getStatusColor(chargePoint.status)" size="small" variant="tonal">
        {{ getStatusLabel(chargePoint.status) }}
      </v-chip>
    </div>

    <div v-if="chargePoint.note" class="detail-row">
      <span class="detail-label">{{ $t('common.note') }}:</span>
      <span class="detail-value">{{ chargePoint.note }}</span>
    </div>

    <div v-if="chargePoint.created_at" class="detail-row">
      <span class="detail-label">{{ $t('common.created') }}:</span>
      <span class="detail-value">{{
        formatDateTime(chargePoint.created_at, userLocale.value)
      }}</span>
    </div>

    <div v-if="chargePoint.updated_at" class="detail-row">
      <span class="detail-label">{{ $t('common.updated') }}:</span>
      <span class="detail-value">{{
        formatDateTime(chargePoint.updated_at, userLocale.value)
      }}</span>
    </div>

    <div v-if="!fullView" class="detail-actions">
      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-eye"
        class="detail-btn"
        @click="$emit('view', chargePoint)"
      >
        {{ $t('common.view') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-pencil"
        class="detail-btn"
        @click="$emit('edit', chargePoint)"
      >
        {{ $t('common.edit') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        color="error"
        prepend-icon="mdi-delete"
        class="detail-btn"
        @click="$emit('delete', chargePoint)"
      >
        {{ $t('common.delete') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { useI18n } from 'vue-i18n'
import type { ChargePoint } from '@/types/chargepoints'
import { formatDateTime } from '@/utils/dateUtils'
import { computed } from 'vue'

interface Props {
  chargePoint: ChargePoint
  fullView?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: [chargePoint: ChargePoint]
  delete: [chargePoint: ChargePoint]
  view: [chargePoint: ChargePoint]
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'faulty':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return t('chargepoints.statusActive')
    case 'inactive':
      return t('chargepoints.statusInactive')
    case 'faulty':
      return t('chargepoints.statusFaulty')
    default:
      return t(`chargePoints.status${status}`)
  }
}
</script>
<style scoped>
.chargepoint-detail {
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
