<template>
  <div class="grouped-data-example">
    <v-card>
      <v-card-title>
        <v-icon start>mdi-group</v-icon>
        Grouped Charge Points Example
      </v-card-title>

      <v-card-text>
        <!-- Group By Controls -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedGroupFields"
              :items="groupFieldOptions"
              label="Group By Fields"
              multiple
              chips
              closable-chips
              @update:modelValue="updateGrouping"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-switch
              v-model="sortGroups"
              label="Sort Groups"
              @update:modelValue="updateGrouping"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-switch v-model="showFlatView" label="Flat View" />
          </v-col>
        </v-row>

        <!-- Statistics -->
        <v-alert v-if="groupStats" type="info" variant="tonal" class="mb-4">
          <div class="d-flex justify-space-between">
            <span>Groups: {{ groupStats.totalGroups }}</span>
            <span>Items: {{ groupStats.totalItems }}</span>
            <span>Max Depth: {{ groupStats.maxDepth }}</span>
            <span>Avg Items/Group: {{ groupStats.avgItemsPerGroup }}</span>
          </div>
        </v-alert>

        <!-- Grouped Data Display -->
        <div v-if="!showFlatView">
          <div class="grouped-data">
            <template v-for="group in groupedChargePoints" :key="`${group.field}-${group.key}`">
              <div class="group-item">
                <v-expansion-panels v-model="expandedGroups" multiple>
                  <v-expansion-panel :value="`${group.field}-${group.key}`">
                    <v-expansion-panel-title>
                      <div class="group-header">
                        <v-chip :color="getGroupColor(group.field)" size="small" class="mr-2">
                          {{ group.field }}
                        </v-chip>
                        <strong>{{ group.key }}</strong>
                        <v-spacer />
                        <v-chip size="small" variant="tonal">
                          {{ group.count }} {{ group.count === 1 ? 'item' : 'items' }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <!-- Render nested groups or items -->
                      <template v-if="Array.isArray(group.children) && group.children.length > 0">
                        <div v-if="'field' in group.children[0]" class="nested-groups">
                          <!-- Nested groups -->
                          <template
                            v-for="subGroup in group.children"
                            :key="`${subGroup.field}-${subGroup.key}`"
                          >
                            <div class="sub-group ml-4">
                              <v-expansion-panels multiple>
                                <v-expansion-panel>
                                  <v-expansion-panel-title>
                                    <div class="group-header">
                                      <v-chip
                                        :color="getGroupColor(subGroup.field)"
                                        size="x-small"
                                        class="mr-2"
                                      >
                                        {{ subGroup.field }}
                                      </v-chip>
                                      <strong>{{ subGroup.key }}</strong>
                                      <v-spacer />
                                      <v-chip size="x-small" variant="tonal">
                                        {{ subGroup.count }}
                                      </v-chip>
                                    </div>
                                  </v-expansion-panel-title>
                                  <v-expansion-panel-text>
                                    <!-- Render items or deeper nesting -->
                                    <div class="items-list">
                                      <template
                                        v-for="item in subGroup.children"
                                        :key="item.id || item.ocpp_charge_box_id"
                                      >
                                        <v-card variant="outlined" class="mb-2 ml-4">
                                          <v-card-text class="py-2">
                                            <div class="d-flex align-center">
                                              <v-chip
                                                :color="getStatusColor(item.status)"
                                                size="small"
                                                variant="tonal"
                                                class="mr-2"
                                              >
                                                {{ item.status }}
                                              </v-chip>
                                              <span class="font-weight-medium">{{
                                                item.ocpp_charge_box_id
                                              }}</span>
                                              <v-spacer />
                                              <span class="text-caption"
                                                >{{ item.manufacturer }} {{ item.model }}</span
                                              >
                                            </div>
                                          </v-card-text>
                                        </v-card>
                                      </template>
                                    </div>
                                  </v-expansion-panel-text>
                                </v-expansion-panel>
                              </v-expansion-panels>
                            </div>
                          </template>
                        </div>
                        <div v-else class="items-list">
                          <!-- Direct items -->
                          <template
                            v-for="item in group.children"
                            :key="item.id || item.ocpp_charge_box_id"
                          >
                            <v-card variant="outlined" class="mb-2 ml-4">
                              <v-card-text class="py-2">
                                <div class="d-flex align-center">
                                  <v-chip
                                    :color="getStatusColor(item.status)"
                                    size="small"
                                    variant="tonal"
                                    class="mr-2"
                                  >
                                    {{ item.status }}
                                  </v-chip>
                                  <span class="font-weight-medium">{{
                                    item.ocpp_charge_box_id
                                  }}</span>
                                  <v-spacer />
                                  <span class="text-caption"
                                    >{{ item.manufacturer }} {{ item.model }}</span
                                  >
                                </div>
                              </v-card-text>
                            </v-card>
                          </template>
                        </div>
                      </template>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </template>
          </div>
        </div>

        <!-- Flat View (for table rendering) -->
        <div v-else>
          <v-data-table
            :headers="flatTableHeaders"
            :items="flattenedData"
            class="flat-table"
            density="compact"
          >
            <template #item="_isGroupHeader" ="{ item }">
              <v-chip v-if="item._isGroupHeader" :color="getGroupColor(item._field)" size="small">
                {{ item._field }}: {{ item._key }} ({{ item._count }})
              </v-chip>
            </template>

            <template #item.ocpp_charge_box_id="{ item }">
              <span :class="{ 'ml-4': item._level > 0, 'font-weight-bold': item._isGroupHeader }">
                {{ item.ocpp_charge_box_id || '-' }}
              </span>
            </template>

            <template #item.status="{ item }">
              <v-chip
                v-if="!item._isGroupHeader && item.status"
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ item.status }}
              </v-chip>
            </template>
          </v-data-table>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  groupByNested,
  flattenGroupedData,
  getGroupStatistics,
  type GroupNode
} from '@/utils/groupByNested'
import { useChargePointsStore } from '@/stores/chargepoints'
import { useSitesStore } from '@/stores/sites'

// Store access
const chargePointsStore = useChargePointsStore()
const sitesStore = useSitesStore()

// Reactive state
const selectedGroupFields = ref<string[]>(['status', 'site_id'])
const sortGroups = ref(true)
const showFlatView = ref(false)
const expandedGroups = ref<string[]>([])

// Group field options
const groupFieldOptions = [
  { title: 'Status', value: 'status' },
  { title: 'Site', value: 'site_id' },
  { title: 'Manufacturer', value: 'manufacturer' },
  { title: 'Model', value: 'model' },
  { title: 'Connector Count', value: 'connector_count' }
]

// Sample data (in a real app, this would come from the store)
const sampleChargePoints = ref([
  {
    id: 1,
    ocpp_charge_box_id: 'CP-001',
    status: 'active',
    site_id: 1,
    manufacturer: 'Tesla',
    model: 'Wall Connector',
    connector_count: 1
  },
  {
    id: 2,
    ocpp_charge_box_id: 'CP-002',
    status: 'active',
    site_id: 1,
    manufacturer: 'Tesla',
    model: 'Wall Connector',
    connector_count: 1
  },
  {
    id: 3,
    ocpp_charge_box_id: 'CP-003',
    status: 'inactive',
    site_id: 2,
    manufacturer: 'ABB',
    model: 'Terra AC',
    connector_count: 2
  },
  {
    id: 4,
    ocpp_charge_box_id: 'CP-004',
    status: 'faulty',
    site_id: 2,
    manufacturer: 'ABB',
    model: 'Terra AC',
    connector_count: 2
  },
  {
    id: 5,
    ocpp_charge_box_id: 'CP-005',
    status: 'active',
    site_id: 3,
    manufacturer: 'Schneider',
    model: 'EVlink',
    connector_count: 1
  },
  {
    id: 6,
    ocpp_charge_box_id: 'CP-006',
    status: 'active',
    site_id: 3,
    manufacturer: 'Schneider',
    model: 'EVlink Pro',
    connector_count: 2
  }
])

// Computed properties
const groupedChargePoints = computed((): GroupNode[] => {
  const data =
    chargePointsStore.allChargePoints.length > 0
      ? chargePointsStore.allChargePoints
      : sampleChargePoints.value

  if (selectedGroupFields.value.length === 0) {
    return []
  }

  return groupByNested(data, selectedGroupFields.value, {
    sortGroupKeys: sortGroups.value,
    labelFormatter: (groupKey: string, field: string) => {
      // Custom formatting for specific fields
      if (field === 'site_id') {
        const site = sitesStore.getSiteById(parseInt(groupKey))
        return site?.name || `Site ${groupKey}`
      }
      if (field === 'status') {
        return groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
      }
      return groupKey
    }
  })
})

const flattenedData = computed(() => {
  return flattenGroupedData(groupedChargePoints.value, true)
})

const groupStats = computed(() => {
  return getGroupStatistics(groupedChargePoints.value)
})

const flatTableHeaders = [
  { title: 'Group', key: '_isGroupHeader', sortable: false },
  { title: 'OCPP ID', key: 'ocpp_charge_box_id', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Manufacturer', key: 'manufacturer', sortable: false },
  { title: 'Model', key: 'model', sortable: false }
]

// Methods
const updateGrouping = () => {
  // Reset expanded groups when grouping changes
  expandedGroups.value = []
}

const getGroupColor = (field: string): string => {
  const colors: Record<string, string> = {
    status: 'primary',
    site_id: 'secondary',
    manufacturer: 'success',
    model: 'warning',
    connector_count: 'info'
  }
  return colors[field] || 'grey'
}

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'faulty':
      return 'error'
    default:
      return 'grey'
  }
}

// Lifecycle
onMounted(async () => {
  // Load data if needed
  if (chargePointsStore.allChargePoints.length === 0) {
    await chargePointsStore.fetchChargePoints()
  }
  if (sitesStore.sites.length === 0) {
    await sitesStore.fetchSites()
  }
})
</script>

<style scoped>
.grouped-data-example {
  width: 100%;
}

.group-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.group-item {
  margin-bottom: 16px;
}

.sub-group {
  margin-top: 8px;
}

.nested-groups {
  margin-left: 16px;
}

.items-list {
  margin-top: 8px;
}

.flat-table .v-data-table__tr--group-header {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.flat-table .v-data-table__tr--group-header td {
  font-weight: 600;
}
</style>
