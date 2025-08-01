<template>
  <div class="tabbed-child-view">
    <v-card class="child-tabs-card" variant="outlined">
      <v-tabs
        v-model="activeTab"
        class="child-tabs"
        color="primary"
        align-tabs="start"
        density="compact"
        show-arrows
      >
        <v-tab v-for="tab in availableTabs" :key="tab.key" :value="tab.key" class="child-tab">
          <v-icon start size="small">{{ tab.icon }}</v-icon>
          {{ tab.title }}
          <v-chip v-if="tab.count !== undefined" size="x-small" variant="outlined" class="ml-2">
            {{ tab.count }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-tabs-window v-model="activeTab" class="child-tabs-window">
        <v-tabs-window-item
          v-for="tab in availableTabs"
          :key="tab.key"
          :value="tab.key"
          class="child-tab-content"
        >
          <div class="tab-content-wrapper">
            <!-- Tab header with actions -->
            <div v-if="tab.showHeader" class="tab-header">
              <div class="tab-header-info">
                <h3 class="tab-title">
                  <v-icon start>{{ tab.icon }}</v-icon>
                  {{ tab.title }}
                </h3>
                <p v-if="tab.description" class="tab-description">
                  {{ tab.description }}
                </p>
              </div>

              <div class="tab-header-actions">
                <v-btn
                  v-if="tab.allowAdd"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="$emit('add-item', tab.key, parentItem)"
                  class="add-item-btn"
                >
                  {{ $t('common.add') }} {{ tab.title }}
                </v-btn>

                <v-btn
                  variant="text"
                  size="small"
                  icon="mdi-refresh"
                  @click="refreshTabData(tab.key)"
                  :loading="isTabLoading(tab.key)"
                  :aria-label="$t('common.refresh')"
                />
              </div>
            </div>

            <!-- Tab content -->
            <div class="tab-body">
              <v-progress-linear
                v-if="isTabLoading(tab.key)"
                indeterminate
                color="primary"
                class="tab-loading"
              />

              <div
                v-if="!isTabLoading(tab.key) && getTabItems(tab.key).length === 0"
                class="empty-state"
              >
                <div class="empty-state-content">
                  <v-icon size="48" color="grey-lighten-1">{{
                    tab.emptyIcon || 'mdi-inbox'
                  }}</v-icon>
                  <h4 class="empty-title">{{ tab.emptyTitle || $t('common.noItems') }}</h4>
                  <p class="empty-description">
                    {{ tab.emptyDescription || $t('common.noItemsDescription') }}
                  </p>
                  <v-btn
                    v-if="tab.allowAdd"
                    variant="flat"
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="$emit('add-item', tab.key, parentItem)"
                    class="empty-action-btn"
                  >
                    {{ $t('common.add') }} {{ tab.title }}
                  </v-btn>
                </div>
              </div>

              <div v-else-if="!isTabLoading(tab.key)" class="tab-data">
                <slot
                  :name="`tab-${tab.key}`"
                  :items="getTabItems(tab.key)"
                  :loading="isTabLoading(tab.key)"
                  :parent-item="parentItem"
                  :tab="tab"
                  :refresh="() => refreshTabData(tab.key)"
                />
              </div>
            </div>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

export interface ChildTab {
  key: string
  title: string
  icon: string
  description?: string
  count?: number
  allowAdd?: boolean
  showHeader?: boolean
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
  autoLoad?: boolean
}

interface Props {
  parentItem: any
  tabs: ChildTab[]
  initialTab?: string
  tabData?: Record<string, any[]>
  loadingStates?: Record<string, boolean>
}

interface Emits {
  (e: 'tab-change', tabKey: string, parentItem: any): void
  (e: 'load-tab-data', tabKey: string, parentItem: any): void
  (e: 'refresh-tab-data', tabKey: string, parentItem: any): void
  (e: 'add-item', tabKey: string, parentItem: any): void
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: '',
  tabData: () => ({}),
  loadingStates: () => ({})
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const activeTab = ref('')

const availableTabs = computed(() => {
  return props.tabs.map((tab) => ({
    ...tab,
    count: props.tabData[tab.key]?.length || 0,
    showHeader: tab.showHeader !== false
  }))
})

const getTabItems = (tabKey: string) => {
  return props.tabData[tabKey] || []
}

const isTabLoading = (tabKey: string) => {
  return props.loadingStates[tabKey] || false
}

const refreshTabData = (tabKey: string) => {
  emit('refresh-tab-data', tabKey, props.parentItem)
}

const loadTabData = (tabKey: string) => {
  emit('load-tab-data', tabKey, props.parentItem)
}

// Watch for tab changes
watch(activeTab, (newTab, oldTab) => {
  if (newTab && newTab !== oldTab) {
    emit('tab-change', newTab, props.parentItem)

    // Auto-load data for the tab if it doesn't exist yet
    const tab = props.tabs.find((t) => t.key === newTab)
    if (tab?.autoLoad !== false && (!props.tabData[newTab] || props.tabData[newTab].length === 0)) {
      loadTabData(newTab)
    }
  }
})

// Initialize with first tab or provided initial tab
onMounted(() => {
  if (props.initialTab && props.tabs.find((t) => t.key === props.initialTab)) {
    activeTab.value = props.initialTab
  } else if (props.tabs.length > 0) {
    activeTab.value = props.tabs[0].key
  }
})

// Watch for tabs changes to reset active tab if needed
watch(
  () => props.tabs,
  (newTabs) => {
    if (
      newTabs.length > 0 &&
      (!activeTab.value || !newTabs.find((t) => t.key === activeTab.value))
    ) {
      activeTab.value = newTabs[0].key
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.tabbed-child-view {
  width: 100%;
}

.child-tabs-card {
  border-radius: 8px;
  overflow: hidden;
}

.child-tabs {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.child-tab {
  text-transform: none;
  font-weight: 500;
  min-height: 40px;
}

.child-tabs-window {
  background: rgb(var(--v-theme-surface));
}

.child-tab-content {
  min-height: 200px;
}

.tab-content-wrapper {
  height: 100%;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.tab-header-info {
  flex: 1;
}

.tab-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-description {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.tab-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}

.add-item-btn {
  text-transform: none;
  font-weight: 500;
}

.tab-loading {
  margin: 0;
}

.tab-body {
  position: relative;
  min-height: 160px;
}

.tab-data {
  padding: 16px 20px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px 20px;
}

.empty-state-content {
  text-align: center;
  max-width: 300px;
}

.empty-title {
  margin: 16px 0 8px;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.empty-description {
  margin: 0 0 20px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.5;
}

.empty-action-btn {
  text-transform: none;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 16px;
  }

  .tab-header-actions {
    margin-left: 0;
    justify-content: flex-end;
  }

  .tab-data {
    padding: 12px 16px;
  }

  .child-tabs {
    overflow-x: auto;
  }

  .empty-state {
    padding: 24px 16px;
    min-height: 160px;
  }
}

@media (max-width: 480px) {
  .tab-header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .add-item-btn {
    width: 100%;
  }
}
</style>
