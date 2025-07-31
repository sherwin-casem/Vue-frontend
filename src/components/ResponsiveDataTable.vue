<!-- ResponsiveTable.vue -->
<template>
  <div class="table-container">
    <v-data-table
      v-bind="$attrs"
      :headers="headers"
      :items="items"
      :item-key="itemKeyField"
      class="scrollable-table"
    >
      <template v-for="(_, slot) in $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  headers: Array<{ title: string; key: string; sortable?: boolean; width?: string }>
  items: any[]
}



const props = defineProps<Props>()



const itemKeyField = computed(() => {
  if (!props.items.length) return 'id'
  const first = props.items[0]
  return (
    first.id ??
    first.site_id ??
    first.charge_point_id ??
    first.profile_id ??
    first.connector_id ??
    first.period_id ??
    'id'
  )
})

// Remove unused methods since we're only using the table now
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

.scrollable-table {
  width: 100%;
  min-width: 800px; /* Ensure table has minimum width for proper display */
}

/* Ensure table scrolls horizontally on smaller screens */
@media (max-width: 1200px) {
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
