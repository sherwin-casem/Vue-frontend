<!-- ActionCell.vue -->
<template>
  <td style="text-align: center" @mouseleave="onCellFocusOut">
    <!-- Only show actions for regular data rows, not group headers -->
    <div v-if="!isGroupHeader">
      <button class="k-button" @click="onClick" ref="button">...</button>
      <Popup
        :anchor="'button'"
        :show="show"
        :popup-class="'popup-content'"
        @mouseleave="onFocusOut"
        @mouseenter="onMouseEnter"
      >
        <div class="popup-menu">
          <div class="action" id="view" @click="onClickAction">{{ t('common.view') }}</div>
          <div class="action" id="update" @click="onClickAction">{{ t('common.update') }}</div>
          <div class="action" id="delete" @click="onClickAction">{{ t('common.delete') }}</div>
        </div>
      </Popup>
    </div>
  </td>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Popup } from '@progress/kendo-vue-popup'
import { useI18n } from 'vue-i18n'
const emit = defineEmits(['actionselect'])
const props = defineProps({ dataItem: Object })
const { t } = useI18n()

// Check if this is a group header row
const isGroupHeader = computed(() => {
  return props.dataItem.aggregates
})

const show = ref(false)
const mouseOverPopup = ref(false)

function onClick() {
  show.value = true
}

function onClickAction(e) {
  emit('actionselect', {
    dataItem: props.dataItem,
    action: e.target.id
  })
  show.value = false
}

function onFocusOut() {
  show.value = false
  mouseOverPopup.value = false
}

function onCellFocusOut() {
  setTimeout(() => {
    if (!mouseOverPopup.value) {
      show.value = false
    }
    mouseOverPopup.value = false
  })
}

function onMouseEnter() {
  mouseOverPopup.value = true
}
</script>
<style scoped>
.k-button {
  border-radius: 5px;
  background-color: var(--action-button-bg);
  color: var(--action-button-text);
  padding: 4px 10px;
  cursor: pointer;
  opacity: 0.85;
  border: var(--popup-border);
  transition: background-color 0.2s;
}

.k-button:hover {
  opacity: 1;
}

.popup-menu {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: var(--popup-bg);
  border: var(--popup-border);
  color: var(--popup-text);
  box-shadow: var(--popup-shadow);
  border-radius: var(--popup-border-radius);
  min-width: 160px;
}

.action {
  margin: 5px 0;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
}

.action:hover {
  background-color: var(--popup-hover-bg);
}
</style>
