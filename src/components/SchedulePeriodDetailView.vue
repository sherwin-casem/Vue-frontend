<template>
  <div class="scheduleperiod-detail">
    <div
      v-if="!fullView"
      class="detail-row"
    >
      <span class="detail-label">{{ $t('scheduleperiods.id') }}:</span>
      <span class="detail-value">{{ schedulePeriod.id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('scheduleperiods.chargingProfileId') }}:</span>
      <span class="detail-value">{{ schedulePeriod.charging_profile_id }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('scheduleperiods.startPeriodInSeconds') }}:</span>
      <span class="detail-value">{{ schedulePeriod.start_period_in_seconds }}s</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('scheduleperiods.limit') }}:</span>
      <span class="detail-value">{{ schedulePeriod.limit }} kW</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">{{ $t('scheduleperiods.numberPhases') }}:</span>
      <v-chip
        :color="getPhaseColor(schedulePeriod.number_phases)"
        size="small"
        variant="tonal"
      >
        {{ schedulePeriod.number_phases }} {{ t('scheduleperiods.phases') }}
      </v-chip>
    </div>

    <div
      v-if="schedulePeriod.created_at"
      class="detail-row"
    >
      <span class="detail-label">{{ $t('common.created') }}:</span>
      <span class="detail-value">{{ formatDate(schedulePeriod.created_at) }}</span>
    </div>

    <div
      v-if="schedulePeriod.updated_at"
      class="detail-row"
    >
      <span class="detail-label">{{ $t('common.updated') }}:</span>
      <span class="detail-value">{{ formatDate(schedulePeriod.updated_at) }}</span>
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
        @click="$emit('view', schedulePeriod)"
      >
        {{ $t('common.view') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-pencil"
        class="detail-btn"
        @click="$emit('edit', schedulePeriod)"
      >
        {{ $t('common.edit') }}
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        color="error"
        prepend-icon="mdi-delete"
        class="detail-btn"
        @click="$emit('delete', schedulePeriod)"
      >
        {{ $t('common.delete') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SchedulePeriod } from '@/types/scheduleperiods'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'

interface Props {
  schedulePeriod: SchedulePeriod
  fullView?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: [schedulePeriod: SchedulePeriod]
  delete: [schedulePeriod: SchedulePeriod]
  view: [schedulePeriod: SchedulePeriod]
}>()

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()

const getPhaseColor = (phases: number) => {
  switch (phases) {
    case 1:
      return 'info'
    case 2:
      return 'warning'
    case 3:
      return 'success'
    default:
      return 'default'
  }
}
</script>

<style scoped>
.scheduleperiod-detail {
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
