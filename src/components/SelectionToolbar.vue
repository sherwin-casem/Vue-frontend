<template>
  <v-slide-y-transition>
    <v-card v-if="selectedItems.length > 0" class="selection-toolbar" elevation="8" color="primary">
      <v-card-text class="toolbar-content">
        <div class="toolbar-left">
          <v-icon color="white" class="selection-icon">mdi-checkbox-multiple-marked</v-icon>
          <span class="selection-count">
            {{ $t('selection.itemsSelected', { count: selectedItems.length }) }}
          </span>
        </div>

        <div class="toolbar-actions">
          <!-- Export dropdown -->
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                color="white"
                prepend-icon="mdi-download"
                class="toolbar-btn"
                :disabled="loading"
              >
                {{ $t('common.export') }}
              </v-btn>
            </template>
            <v-list class="export-menu">
              <v-list-subheader class="export-subheader">
                {{ $t('selection.exportSelected') }} ({{ selectedItems.length }})
              </v-list-subheader>
              <v-list-item @click="$emit('export', 'pdf')" class="export-item">
                <template v-slot:prepend>
                  <v-icon color="red">mdi-file-pdf-box</v-icon>
                </template>
                <v-list-item-title>{{ $t('export.exportToPdf') }}</v-list-item-title>
              </v-list-item>
              <v-list-item @click="$emit('export', 'excel')" class="export-item">
                <template v-slot:prepend>
                  <v-icon color="green">mdi-file-excel</v-icon>
                </template>
                <v-list-item-title>{{ $t('export.exportToExcel') }}</v-list-item-title>
              </v-list-item>
              <v-list-item @click="$emit('export', 'csv')" class="export-item">
                <template v-slot:prepend>
                  <v-icon color="blue">mdi-file-delimited</v-icon>
                </template>
                <v-list-item-title>{{ $t('export.exportToCsv') }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Delete button -->
          <v-btn
            variant="outlined"
            color="white"
            prepend-icon="mdi-delete"
            class="toolbar-btn"
            :loading="deleteLoading"
            :disabled="loading"
            @click="$emit('delete')"
          >
            {{ $t('common.delete') }}
          </v-btn>

          <!-- Clear selection button -->
          <v-btn
            icon
            variant="outlined"
            color="white"
            class="toolbar-btn close-btn"
            :disabled="loading"
            @click="$emit('clear')"
            :aria-label="$t('selection.clearSelection')"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-text>

      <!-- Progress bar for batch operations -->
      <v-progress-linear
        v-if="deleteLoading && deleteProgress > 0"
        :model-value="deleteProgress"
        color="white"
        height="3"
        class="progress-bar"
      />
    </v-card>
  </v-slide-y-transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  selectedItems: any[]
  loading?: boolean
  deleteLoading?: boolean
  deleteProgress?: number
}

interface Emits {
  (e: 'export', format: 'pdf' | 'excel' | 'csv'): void
  (e: 'delete'): void
  (e: 'clear'): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
  deleteLoading: false,
  deleteProgress: 0
})

defineEmits<Emits>()
const { t } = useI18n()
</script>

<style scoped>
.selection-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  min-width: 400px;
  max-width: 90vw;
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: rgb(var(--v-theme-primary));
  backdrop-filter: blur(10px);
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px !important;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-icon {
  font-size: 1.25rem;
}

.selection-count {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  border-radius: 20px;
  text-transform: none;
  font-weight: 500;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.toolbar-btn:active {
  transform: translateY(0);
}

.close-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
}

.export-menu {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.export-item {
  transition: background-color 0.2s ease;
}

.export-item:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}

.export-subheader {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-bar {
  border-radius: 0 0 28px 28px;
  opacity: 0.8;
}

/* Dark theme adjustments */
.v-theme--dark .selection-toolbar {
  background: rgb(var(--v-theme-primary));
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.v-theme--dark .toolbar-btn {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.v-theme--dark .toolbar-btn:hover {
  border-color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.25);
}

/* Responsive design */
@media (max-width: 768px) {
  .selection-toolbar {
    min-width: 320px;
    bottom: 16px;
  }

  .toolbar-content {
    padding: 10px 16px !important;
    gap: 12px;
  }

  .toolbar-actions {
    gap: 6px;
  }

  .toolbar-btn {
    font-size: 0.8rem;
    padding: 0 12px;
    height: 36px;
  }

  .selection-count {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .selection-toolbar {
    min-width: 280px;
    max-width: 95vw;
  }

  .toolbar-content {
    flex-direction: column;
    gap: 8px;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: center;
  }

  .selection-count {
    text-align: center;
  }
}
</style>
