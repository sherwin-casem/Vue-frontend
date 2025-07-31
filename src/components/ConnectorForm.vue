<template>
  <v-card class="connector-form-card">
    <v-card-title class="form-title">
      <v-icon color="primary" start>mdi-power-plug</v-icon>
      {{ connector ? $t('connectors.editConnector') : $t('connectors.createNewConnector') }}
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.charge_point_id"
                :label="$t('connectors.chargePoint')"
                :items="chargePointOptions"
                item-title="text"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                :loading="chargePointsLoading"
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.connector_number"
                :label="$t('connectors.connectorNumber')"
                type="number"
                :rules="[rules.required, rules.connectorNumber]"
                variant="outlined"
                density="compact"
                min="1"
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.type"
                :label="$t('connectors.type')"
                :items="connectorTypeOptions"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.max_power_kw"
                :label="$t('connectors.maxPower')"
                type="number"
                :rules="[rules.required, rules.maxPower]"
                variant="outlined"
                density="compact"
                min="0.1"
                step="0.1"
                suffix="kW"
                required
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="formData.status"
                :label="$t('common.status')"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                required
              />
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>

    <v-card-actions class="form-actions">
      <v-spacer />
      <v-btn variant="text" @click="$emit('cancel')" :disabled="loading">
        {{ $t('common.cancel') }}
      </v-btn>
      <v-btn color="primary" variant="flat" @click="handleSubmit" :loading="loading">
        {{ connector ? $t('common.update') : $t('common.create') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChargePointsStore } from '@/stores/chargepoints'
import type { Connector, CreateConnectorRequest, UpdateConnectorRequest } from '@/types/connectors'

interface Props {
  connector?: Connector | null
  loading?: boolean
}

interface Emits {
  (e: 'submit', value: CreateConnectorRequest | UpdateConnectorRequest): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  connector: null,
  loading: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const chargePointsStore = useChargePointsStore()

// Form reference
const formRef = ref()

// Form data
const formData = ref<CreateConnectorRequest>({
  charge_point_id: 0,
  connector_number: 1,
  type: '',
  max_power_kw: 22.0,
  status: 'available'
})

// Loading state
const chargePointsLoading = computed(() => chargePointsStore.loading)

// Validation rules
const rules = {
  required: (value: any) => !!value || t('validation.fieldRequired'),
  connectorNumber: (value: number) => {
    if (!value || value < 1) return t('connectors.validation.connectorNumberMin')
    if (value > 10) return t('connectors.validation.connectorNumberMax')
    return true
  },
  maxPower: (value: number) => {
    if (!value || value <= 0) return t('connectors.validation.maxPowerMin')
    if (value > 500) return t('connectors.validation.maxPowerMax')
    return true
  }
}

// Options
const connectorTypeOptions = [
  'Type1',
  'Type2',
  'CCS',
  'CHAdeMO',
  'Tesla Supercharger',
  'Schuko',
  'CEE'
]

const statusOptions = computed(() => [
  { title: t('status.available'), value: 'available' },
  { title: t('status.faulted'), value: 'faulted' }
])

const chargePointOptions = computed(() => {
  return chargePointsStore.chargePoints.map((cp) => ({
    text: `${cp.ocpp_charge_box_id} (${cp.manufacturer} ${cp.model})`,
    value: cp.id
  }))
})

// Watch for connector prop changes
watch(
  () => props.connector,
  (newConnector) => {
    if (newConnector) {
      formData.value = {
        charge_point_id: newConnector.charge_point_id,
        connector_number: newConnector.connector_number,
        type: newConnector.type,
        max_power_kw: newConnector.max_power_kw,
        status: newConnector.status
      }
    } else {
      // Reset form for new connector
      formData.value = {
        charge_point_id: 0,
        connector_number: 1,
        type: '',
        max_power_kw: 22.0,
        status: 'available'
      }
    }
  },
  { immediate: true }
)

// Form submission
const handleSubmit = async (): Promise<void> => {
  const { valid } = await formRef.value.validate()

  if (!valid) return

  if (props.connector?.id) {
    // Update existing connector
    const updateData: UpdateConnectorRequest = {
      id: props.connector.id,
      ...formData.value
    }
    emit('submit', updateData)
  } else {
    // Create new connector
    emit('submit', formData.value)
  }
}

// Load charge points on mount
onMounted(async () => {
  if (chargePointsStore.chargePoints.length === 0) {
    await chargePointsStore.fetchChargePoints()
  }
})
</script>

<style scoped>
.connector-form-card {
  max-width: 700px;
  margin: 0 auto;
}

.form-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  padding: 20px 24px 16px;
}

.form-actions {
  padding: 16px 24px 24px;
}

@media (max-width: 600px) {
  .connector-form-card {
    margin: 16px;
  }

  .form-title {
    font-size: 1.25rem;
  }
}
</style>
