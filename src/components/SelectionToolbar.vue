<template>
  <v-slide-y-transition>
    <div v-if="selectedCount > 0" class="selection-toolbar">
      <v-card elevation="8" class="toolbar-card">
        <v-card-text class="toolbar-content">
          <div class="toolbar-info">
            <v-icon class="toolbar-icon" color="primary">mdi-checkbox-marked-circle</v-icon>
            <span class="selection-count">
              {{ $t('common.selectedItems', { count: selectedCount }) }}
            </span>
          </div>

          <div class="toolbar-actions">
            <v-btn
              variant="outlined"
              color="primary"
              @click="$emit('export-selected')"
              :disabled="loading"
              class="toolbar-btn"
            >
            <v-icon>mdi-export</v-icon>
            </v-btn>

            <v-btn
              variant="outlined"
              color="error"
              @click="$emit('delete-selected')"
              :disabled="loading"
              :loading="loading"
              class="toolbar-btn"
            >
              <!-- {{ $t('common.deleteSelected') }}
                 -->
              <v-icon>mdi-delete</v-icon>
            </v-btn>

            <v-btn
              variant="text"
              icon="mdi-close"
              @click="$emit('clear-selection')"
              :disabled="loading"
              class="toolbar-btn close-btn"
            >
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-slide-y-transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  selectedCount: number
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  'export-selected': []
  'delete-selected': []
  'clear-selection': []
}>()

const { t } = useI18n()
</script>

<style scoped>
.selection-toolbar {
  position: fixed;
  bottom: 24px;
  left: 65%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

.toolbar-card {
  border-radius: 28px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px !important;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-icon {
  font-size: 24px;
}

.selection-count {
  font-weight: 600;
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  border-radius: 20px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  height: 40px !important;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.close-btn {
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 768px) {
  .selection-toolbar {
    bottom: 16px;
    left: 16px;
    right: 16px;
    transform: none;
  }

  .toolbar-content {
    flex-direction: column;
    gap: 16px;
    padding: 16px !important;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .toolbar-btn {
    flex: 1;
    max-width: 120px;
  }

  .close-btn {
    flex: none;
  }
}
</style>
