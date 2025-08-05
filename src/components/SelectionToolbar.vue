<template>
  <v-slide-y-transition>
    <div v-if="selectedCount > 0" class="selection-toolbar">
      <v-card elevation="6" class="toolbar-card">
        <v-card-text class="toolbar-content">
          <div class="toolbar-info">
            <v-icon class="toolbar-icon" color="primary" size="20"
              >mdi-checkbox-marked-circle</v-icon
            >
            <span class="selection-count">
              {{ $t('selection.itemsSelected', selectedCount) }}
            </span>
          </div>

          <div class="toolbar-actions">
            <v-menu offset-y>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  color="primary"
                  size="small"
                  :disabled="loading"
                  class="action-btn"
                >
                  <v-icon size="18">mdi-export</v-icon>
                  <span class="btn-text">{{ $t('selection.exportSelected') }}</span>
                  <v-icon size="16">mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="export-menu">
                <v-list-item @click="handleExport('pdf')" class="export-item">
                  <template v-slot:prepend>
                    <v-icon size="18" color="error">mdi-file-pdf-box</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('export.exportToPdf') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleExport('excel')" class="export-item">
                  <template v-slot:prepend>
                    <v-icon size="18" color="success">mdi-file-excel</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('export.exportToExcel') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleExport('csv')" class="export-item">
                  <template v-slot:prepend>
                    <v-icon size="18" color="info">mdi-file-delimited</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('export.exportToCsv') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-btn
              variant="outlined"
              color="error"
              size="small"
              @click="handleDelete"
              :disabled="loading"
              :loading="loading"
              class="action-btn"
            >
              <v-icon size="18">mdi-delete</v-icon>
              <span class="btn-text">{{ $t('selection.deleteSelected') }}</span>
            </v-btn>

            <v-btn
              variant="text"
              size="small"
              icon
              @click="$emit('clear-selection')"
              :disabled="loading"
              class="close-btn"
              :title="$t('selection.clearSelection')"
            >
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-slide-y-transition>

  <ConfirmationDialog
    v-model="deleteDialogOpen"
    :title="$t('selection.confirmBatchDelete')"
    :message="$t('selection.confirmBatchDeleteMessage', { count: selectedCount })"
    :confirm-text="$t('common.delete')"
    :loading="loading"
    @confirm="confirmDelete"
    @cancel="deleteDialogOpen = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmationDialog from './ConfirmationDialog.vue'

interface Props {
  selectedCount: number
  loading?: boolean
}

interface Emits {
  (e: 'export-selected', format: 'pdf' | 'excel' | 'csv'): void
  (e: 'delete-selected'): void
  (e: 'clear-selection'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const deleteDialogOpen = ref(false)

const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
  emit('export-selected', format)
}

const handleDelete = () => {
  deleteDialogOpen.value = true
}

const confirmDelete = () => {
  emit('delete-selected')
  deleteDialogOpen.value = false
}
</script>

<style scoped>
.selection-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 320px;
  max-width: 90vw;
  animation: slideUp 0.3s ease-out;
}

.toolbar-card {
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 16px !important;
  min-height: 48px;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar-icon {
  flex-shrink: 0;
}

.selection-count {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  border-radius: 16px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  height: 32px !important;
  min-width: auto !important;
  padding: 0 12px !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-text {
  font-size: 0.875rem;
  margin: 0 4px;
}

.close-btn {
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  flex-shrink: 0;
}

.export-menu {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.export-item {
  min-height: 40px !important;
  padding: 8px 16px !important;
}

.export-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
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
    min-width: auto;
    max-width: none;
  }

  .toolbar-content {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px !important;
    min-height: auto;
  }

  .toolbar-info {
    order: 1;
    width: 100%;
    justify-content: center;
  }

  .toolbar-actions {
    order: 2;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: 120px;
    max-width: 140px;
  }

  .close-btn {
    flex: none;
    order: 3;
  }

  .btn-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .toolbar-content {
    padding: 10px 12px !important;
  }

  .toolbar-actions {
    gap: 6px;
  }

  .action-btn {
    min-width: 100px;
    padding: 0 8px !important;
  }

  .selection-count {
    font-size: 0.8rem;
  }
}
</style>
