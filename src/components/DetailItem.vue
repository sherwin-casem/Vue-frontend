<template>
  <Grid
    :data-items="getFilteredItem"
    :columns="props.columns"
  />
</template>

<script setup>
import { computed } from 'vue'
import { Grid } from '@progress/kendo-vue-grid'
import { filterBy } from '@progress/kendo-data-query'

const props = defineProps({
  dataItem: Object,
  columns: [],
  items: []
})

const getFilteredItem = computed(() =>
  filterBy(props.items, {
    field: 'Category.CategoryID',
    operator: 'eq',
    value: props.dataItem.charge_point_id || props.dataItem.id
  })
)
</script>
