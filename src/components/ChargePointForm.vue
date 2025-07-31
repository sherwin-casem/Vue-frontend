<template>
  <v-card class="chargepoint-form">
    <v-card-title class="form-title">
      {{ isEdit ? $t('chargePoints.editChargePoint') : $t('chargePoints.createNewChargePoint') }}
    </v-card-title>
    
    <v-card-text>
      <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="formData.ocpp_charge_box_id"
              :label="$t('chargePoints.ocppChargeBoxId')"
              :placeholder="$t('forms.ocppIdPlaceholder')"
              :rules="ocppIdRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-select
              v-model="formData.site_id"
              :label="$t('chargePoints.site')"
              :items="siteOptions"
              item-title="name"
              item-value="site_id"
              :rules="siteRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-select
              v-model="formData.status"
              :label="$t('common.status')"
              :items="statusOptions"
              :rules="statusRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="formData.manufacturer"
              :label="$t('chargePoints.manufacturer')"
              :placeholder="$t('forms.manufacturerPlaceholder')"
              :rules="manufacturerRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="formData.model"
              :label="$t('chargePoints.model')"
              :placeholder="$t('forms.modelPlaceholder')"
              :rules="modelRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="formData.connector_count"
              :label="$t('chargePoints.connectorCount')"
              type="number"
              min="1"
              max="10"
              :rules="connectorCountRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12">
            <v-textarea
              v-model="formData.note"
              :label="`${$t('common.note')} (${$t('common.optional')})`"
              :placeholder="$t('forms.notePlaceholder')"
              variant="outlined"
              density="compact"
              rows="3"
              no-resize
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
    
    <v-card-actions class="form-actions">
      <v-spacer />
      <v-btn 
        variant="text" 
        @click="handleCancel"
        :disabled="loading"
      >
        {{ $t('common.cancel') }}
      </v-btn>
      <v-btn 
        color="primary" 
        variant="flat"
        @click="handleSubmit"
        :loading="loading"
        :disabled="!isFormValid"
      >
        {{ isEdit ? $t('chargePoints.updateChargePoint') : $t('chargePoints.createChargePoint') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChargePoint, CreateChargePointRequest, UpdateChargePointRequest } from '@/types/chargepoints'
import { useSitesStore } from '@/stores/sites'

interface Props {
  chargePoint?: ChargePoint | null
  loading?: boolean
}

interface Emits {
  (e: 'submit', data: CreateChargePointRequest | UpdateChargePointRequest): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  chargePoint: null,
  loading: false
})

const emit = defineEmits<Emits>()
const sitesStore = useSitesStore()
const { t } = useI18n()

const form = ref()
const isFormValid = ref(false)

const isEdit = computed(() => !!props.chargePoint?.id)

const formData = reactive<CreateChargePointRequest>({
  ocpp_charge_box_id: '',
  site_id: 0,
  manufacturer: '',
  model: '',
  connector_count: 1,
  status: 'active',
  note: ''
})

// Status options from API documentation
const statusOptions = computed(() => [
  { title: t('status.active'), value: 'active' },
  { title: t('status.inactive'), value: 'inactive' },
  { title: t('status.faulty'), value: 'faulty' }
])

// Site options computed from sites store
const siteOptions = computed(() => sitesStore.sites)

// Form validation rules
const ocppIdRules = [
  (v: string) => !!v || t('chargePoints.validation.ocppIdRequired'),
  (v: string) => v.length >= 3 || t('chargePoints.validation.ocppIdMinLength'),
  (v: string) => /^[A-Za-z0-9\-_]+$/.test(v) || t('chargePoints.validation.ocppIdFormat')
]

const siteRules = [
  (v: number) => !!v || t('chargePoints.validation.siteRequired'),
  (v: number) => v > 0 || t('chargePoints.validation.siteValid')
]

const manufacturerRules = [
  (v: string) => !!v || t('chargePoints.validation.manufacturerRequired'),
  (v: string) => v.length >= 2 || t('chargePoints.validation.manufacturerMinLength')
]

const modelRules = [
  (v: string) => !!v || t('chargePoints.validation.modelRequired'),
  (v: string) => v.length >= 2 || t('chargePoints.validation.modelMinLength')
]

const connectorCountRules = [
  (v: number) => !!v || t('chargePoints.validation.connectorCountRequired'),
  (v: number) => v >= 1 || t('chargePoints.validation.connectorCountMin'),
  (v: number) => v <= 10 || t('chargePoints.validation.connectorCountMax'),
  (v: number) => Number.isInteger(v) || t('chargePoints.validation.connectorCountInteger')
]

const statusRules = [
  (v: string) => !!v || t('chargePoints.validation.statusRequired')
]

// Watch for prop changes to populate form
watch(() => props.chargePoint, (newChargePoint) => {
  if (newChargePoint) {
    formData.ocpp_charge_box_id = newChargePoint.ocpp_charge_box_id
    formData.site_id = newChargePoint.site_id
    formData.manufacturer = newChargePoint.manufacturer
    formData.model = newChargePoint.model
    formData.connector_count = newChargePoint.connector_count
    formData.status = newChargePoint.status
    formData.note = newChargePoint.note || ''
  }
}, { immediate: true })

const handleSubmit = async (): Promise<void> => {
  const { valid } = await form.value.validate()
  
  if (!valid) return
  
  const submitData = isEdit.value
    ? { ...formData, id: props.chargePoint!.id! } as UpdateChargePointRequest
    : formData as CreateChargePointRequest
    
  emit('submit', submitData)
}

const handleCancel = (): void => {
  emit('cancel')
}

const resetForm = (): void => {
  formData.ocpp_charge_box_id = ''
  formData.site_id = 0
  formData.manufacturer = ''
  formData.model = ''
  formData.connector_count = 1
  formData.status = 'active'
  formData.note = ''
  form.value?.resetValidation()
}

// Load sites when component mounts
onMounted(async () => {
  if (sitesStore.sites.length === 0) {
    await sitesStore.fetchSites()
  }
})

// Expose reset method for parent component
defineExpose({
  resetForm
})
</script>

<style scoped>
.chargepoint-form {
  max-width: 600px;
}

.form-title {
  padding: 20px 24px 16px;
  font-weight: 600;
}

.form-actions {
  padding: 16px 24px 24px;
}
</style>
