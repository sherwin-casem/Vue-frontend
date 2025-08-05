<template>
  <div class="site-detail">
    <div
      v-if="fullView"
      class="text-h6 mb-4"
    >
      {{ $t('sites.siteDetails') }}
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('sites.siteId') }}:</span>
      <span class="site-detail-value">{{ site.site_id }}</span>
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('sites.siteName') }}:</span>
      <span class="site-detail-value">{{ site.name }}</span>
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('sites.address') }}:</span>
      <span class="site-detail-value">{{ site.address }}</span>
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('sites.postalCode') }}:</span>
      <span class="site-detail-value">{{ site.postal_code }}</span>
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('sites.city') }}:</span>
      <span class="site-detail-value">{{ site.city }}</span>
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('sites.country') }}:</span>
      <span class="site-detail-value">{{ site.country }}</span>
    </div>

    <div class="site-detail-row">
      <span class="site-detail-label">{{ $t('common.created') }}:</span>
      <span class="site-detail-value">{{ formatDate(site.created_at) }}</span>
    </div>

    <div
      v-if="site.note"
      class="site-detail-row"
    >
      <span class="site-detail-label">{{ $t('common.note') }}:</span>
      <span class="site-detail-value">{{ site.note }}</span>
    </div>

    <div
      v-if="!fullView"
      class="d-flex justify-end mt-4"
    >
      <v-btn
        size="small"
        variant="outlined"
        color="primary"
        class="mr-2"
        @click="$emit('edit', site)"
      >
        <v-icon
          left
          small
        >
          mdi-pencil
        </v-icon>
        {{ $t('common.edit') }}
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="error"
        @click="$emit('delete', site)"
      >
        <v-icon
          left
          small
        >
          mdi-delete
        </v-icon>
        {{ $t('common.delete') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleFormatting } from '@/composables/useLocaleFormatting'

const { formatDate } = useLocaleFormatting()
const { t } = useI18n()

defineProps({
  site: {
    type: Object,
    required: true
  },
  fullView: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'delete'])
</script>

<style scoped>
.site-detail {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.site-detail-row {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.5;
}

.site-detail-label {
  font-weight: 500;
  min-width: 120px;
  color: rgba(0, 0, 0, 0.7);
}

.site-detail-value {
  flex: 1;
}

@media (max-width: 600px) {
  .site-detail-row {
    flex-direction: column;
  }

  .site-detail-label {
    margin-bottom: 4px;
  }
}
</style>
