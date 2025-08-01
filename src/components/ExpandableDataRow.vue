<template>
  <div class="expandable-data-row">
    <div
      class="parent-row"
      :class="{ expanded: expanded, 'has-children': hasChildren }"
      @click="toggleExpansion"
    >
      <div class="expand-button-container">
        <v-btn
          v-if="hasChildren"
          :icon="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          variant="text"
          size="small"
          class="expand-button"
          @click.stop="toggleExpansion"
          :aria-label="expanded ? $t('common.collapse') : $t('common.expand')"
        />
        <div v-else class="expand-placeholder"></div>
      </div>

      <div class="parent-content">
        <slot name="parent" :item="item" :expanded="expanded" />
      </div>
    </div>

    <v-expand-transition>
      <div v-if="expanded && hasChildren" class="child-content">
        <div class="child-container">
          <slot
            name="children"
            :item="item"
            :loading="childrenLoading"
            :children="children"
            :fetch-children="fetchChildren"
            :refresh-children="refreshChildren"
          />
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  item: any
  expanded?: boolean
  hasChildren?: boolean
  children?: any[]
  childrenLoading?: boolean
  autoFetch?: boolean
}

interface Emits {
  (e: 'update:expanded', value: boolean): void
  (e: 'expand', item: any): void
  (e: 'collapse', item: any): void
  (e: 'fetch-children', item: any): void
  (e: 'refresh-children', item: any): void
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  hasChildren: true,
  children: () => [],
  childrenLoading: false,
  autoFetch: true
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const expanded = ref(props.expanded)

const toggleExpansion = () => {
  if (!props.hasChildren) return

  expanded.value = !expanded.value
  emit('update:expanded', expanded.value)

  if (expanded.value) {
    emit('expand', props.item)
    if (props.autoFetch && (!props.children || props.children.length === 0)) {
      fetchChildren()
    }
  } else {
    emit('collapse', props.item)
  }
}

const fetchChildren = () => {
  emit('fetch-children', props.item)
}

const refreshChildren = () => {
  emit('refresh-children', props.item)
}

// Watch for external changes to expanded prop
watch(
  () => props.expanded,
  (newVal) => {
    expanded.value = newVal
  }
)
</script>

<style scoped>
.expandable-data-row {
  width: 100%;
}

.parent-row {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  min-height: 48px;
}

.parent-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.parent-row.expanded {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.expand-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.expand-button {
  color: rgb(var(--v-theme-primary));
  transition: transform 0.2s ease;
}

.expand-placeholder {
  width: 24px;
  height: 24px;
}

.parent-content {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
}

.child-content {
  margin-left: 40px;
  border-left: 2px solid rgba(var(--v-theme-primary), 0.2);
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.child-container {
  padding: 16px 16px 16px 24px;
  border-radius: 0 8px 8px 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .child-content {
    margin-left: 20px;
  }

  .child-container {
    padding: 12px 12px 12px 16px;
  }

  .expand-button-container {
    width: 32px;
    height: 32px;
  }
}
</style>
