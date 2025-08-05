<template>
  <v-dialog v-model="internalDialog" max-width="500px" persistent>
    <v-card class="confirmation-dialog">
      <v-card-title class="dialog-header">
        <v-icon class="dialog-icon" :color="iconColor" size="28">{{ icon }}</v-icon>
        <span class="dialog-title">{{ title }}</span>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="dialog-content">
        <p class="message-text">{{ message }}</p>
        <v-alert
          v-if="showWarning"
          type="warning"
          variant="tonal"
          density="compact"
          class="warning-alert"
        >
          {{ $t('common.actionCannotBeUndone') }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="handleCancel" :disabled="loading" class="cancel-btn">
          {{ cancelText || $t('common.cancel') }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="elevated"
          @click="handleConfirm"
          :loading="loading"
          class="confirm-btn"
        >
          {{ confirmText || $t('common.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  icon?: string
  showWarning?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmColor: 'error',
  icon: 'mdi-alert-circle',
  showWarning: true,
  loading: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const internalDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const iconColor = computed(() => {
  switch (props.confirmColor) {
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    default:
      return 'primary'
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  internalDialog.value = false
}
</script>

<style scoped>
.confirmation-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 16px;
  background: rgba(var(--v-theme-surface), 1);
}

.dialog-icon {
  flex-shrink: 0;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
}

.dialog-content {
  padding: 16px 24px 24px !important;
}

.message-text {
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 16px;
  color: rgb(var(--v-theme-on-surface));
}

.warning-alert {
  margin-top: 16px;
}

.dialog-actions {
  padding: 16px 24px 24px !important;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  border-radius: 8px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  min-width: 80px;
  height: 40px !important;
}

.confirm-btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.confirm-btn:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

@media (max-width: 600px) {
  .dialog-header {
    padding: 20px 20px 12px;
  }

  .dialog-content {
    padding: 12px 20px 20px !important;
  }

  .dialog-actions {
    padding: 12px 20px 20px !important;
    flex-direction: column-reverse;
    gap: 8px;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
