<template>
  <div class="connector-detail">
    <div
      v-if="!fullView"
      class="detail-row"
    >
      <span class="detail-label">{{ $t('connectors.id') }}:</span>
      <span class="detail-value">{{ connector.id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('connectors.chargePointId') }}:</span>
      <span class="detail-value">{{ connector.charge_point_id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('connectors.connectorNumber') }}:</span>
      <span class="detail-value">{{ connector.connector_number }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('connectors.type') }}:</span>
      <span class="detail-value">{{ connector.type }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('connectors.maxPowerKw') }}:</span>
      <span class="detail-value">{{ connector.max_power_kw }} kW</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('connectors.status') }}:</span>
      <v-chip
        :color="getStatusColor(connector.status)"
        size="small"
        variant="tonal"
      >
        {{ getStatusLabel(connector.status) }}
      </v-chip>
    </div>

    <div
      v-if="connector.created_at"
      class="detail-row"
    >
      <span class="detail-label">{{ $t('common.created') }}:</span>
      <span class="detail-value">{{ formatDate(connector.created_at) }}</span>
    </div>

    <div
      v-if="connector.updated_at"
      class="detail-row"
    >
      <span class="detail-label">{{ $t('common.updated') }}:</span>
      <span class="detail-value">{{ formatDate(connector.updated_at) }}</span>
    </div>

    <div
      v-if="!fullView"
      class="detail-actions"
    >
      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-eye"
        class="detail-btn"
        @click="$emit('view', connector)"
      >
        {{ $t('common.view') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-pencil"
        class="detail-btn"
        @click="$emit('edit', connector)"
      >
        {{ $t('common.edit') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        color="error"
        prepend-icon="mdi-delete"
        class="detail-btn"
        @click="$emit('delete', connector)"
      >
        {{ $t('common.delete') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Connector } from '@/types/connectors'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'

interface Props {
  connector: Connector
  fullView?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: [connector: Connector]
  delete: [connector: Connector]
  view: [connector: Connector]
}>()

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'success'
    case 'faulted':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'available':
      return t('connectors.statusAvailable')
    case 'faulted':
      return t('connectors.statusFaulted')
    default:
      return status
  }
}
</script>

<style scoped>
.connector-detail {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  min-width: 140px;
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
