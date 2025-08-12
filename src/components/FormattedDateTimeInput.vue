<template>
  <div class="formatted-datetime-input">
    <v-text-field
      ref="displayField"
      :model-value="displayValue"
      :label="label"
      :placeholder="placeholder"
      :rules="rules"
      :variant="variant"
      :required="required"
      readonly
      @click="openDateTimeDialog"
      @focus="openDateTimeDialog"
      :prepend-inner-icon="'mdi-calendar-clock'"
    >
      <template #append-inner>
        <v-btn icon variant="text" size="small" @click="clearValue" :disabled="!modelValue">
          <v-icon size="16">mdi-close</v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <v-dialog v-model="dialogOpen" max-width="400px">
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ label }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="internalValue"
            :label="label"
            type="datetime-local"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelEdit"> Cancel </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveValue"> Save </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatDateTime } from '@/utils/dateUtils'

interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  rules?: Array<(v: any) => boolean | string>
  variant?: string
  required?: boolean
  locale?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  rules: () => [],
  variant: 'outlined',
  required: false,
  locale: 'de-DE'
})

const emit = defineEmits<Emits>()

const dialogOpen = ref(false)
const internalValue = ref('')
const displayField = ref()

const displayValue = computed(() => {
  const userLocale = navigator.language || 'en-US'
  if (!props.modelValue) return ''
  return formatDateTime(props.modelValue, userLocale)
})

const openDateTimeDialog = () => {
  // Convert the current value to datetime-local format for editing
  if (props.modelValue) {
    try {
      const date = new Date(props.modelValue)
      internalValue.value = date.toISOString().slice(0, 16)
    } catch {
      internalValue.value = ''
    }
  } else {
    internalValue.value = ''
  }
  dialogOpen.value = true
}

const saveValue = () => {
  if (internalValue.value) {
    // Convert back to ISO string
    const date = new Date(internalValue.value)
    emit('update:modelValue', date.toISOString())
  } else {
    emit('update:modelValue', '')
  }
  dialogOpen.value = false
}

const cancelEdit = () => {
  dialogOpen.value = false
}

const clearValue = () => {
  emit('update:modelValue', '')
}

// Watch for external changes to the model value
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && internalValue.value) {
      try {
        const date = new Date(newValue)
        internalValue.value = date.toISOString().slice(0, 16)
      } catch {
        internalValue.value = ''
      }
    }
  }
)
</script>

<style scoped>
.formatted-datetime-input .v-field__input {
  cursor: pointer;
}

.formatted-datetime-input .v-field--readonly .v-field__input {
  cursor: pointer;
}
</style>
