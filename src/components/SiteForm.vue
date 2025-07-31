<template>
  <v-card class="site-form">
    <v-card-title class="form-title">
      {{ isEdit ? $t('sites.editSite') : $t('sites.createNewSite') }}
    </v-card-title>
    
    <v-card-text>
      <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="formData.name"
              :label="$t('sites.siteName')"
              :placeholder="$t('forms.siteNamePlaceholder')"
              :rules="nameRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12">
            <v-text-field
              v-model="formData.address"
              :label="$t('sites.address')"
              :placeholder="$t('forms.addressPlaceholder')"
              :rules="addressRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="formData.postal_code"
              :label="$t('sites.postalCode')"
              :placeholder="$t('forms.postalCodePlaceholder')"
              :rules="postalCodeRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="formData.city"
              :label="$t('sites.city')"
              :placeholder="$t('forms.cityPlaceholder')"
              :rules="cityRules"
              variant="outlined"
              density="compact"
              required
            />
          </v-col>
          
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="formData.country"
              :label="$t('sites.country')"
              :placeholder="$t('forms.countryPlaceholder')"
              :rules="countryRules"
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
        {{ isEdit ? $t('sites.updateSite') : $t('sites.createSite') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Site, CreateSiteRequest, UpdateSiteRequest } from '@/types/sites'

interface Props {
  site?: Site | null
  loading?: boolean
}

interface Emits {
  (e: 'submit', data: CreateSiteRequest | UpdateSiteRequest): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  site: null,
  loading: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const form = ref()
const isFormValid = ref(false)

const isEdit = computed(() => !!props.site?.site_id)

const formData = reactive<CreateSiteRequest>({
  name: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  note: ''
})

// Form validation rules
const nameRules = [
  (v: string) => !!v || t('sites.validation.nameRequired'),
  (v: string) => v.length >= 3 || t('sites.validation.nameMinLength')
]

const addressRules = [
  (v: string) => !!v || t('sites.validation.addressRequired'),
  (v: string) => v.length >= 5 || t('sites.validation.addressMinLength')
]

const postalCodeRules = [
  (v: string) => !!v || t('sites.validation.postalCodeRequired'),
  (v: string) => /^\d{4,10}$/.test(v) || t('sites.validation.postalCodeFormat')
]

const cityRules = [
  (v: string) => !!v || t('sites.validation.cityRequired'),
  (v: string) => v.length >= 2 || t('sites.validation.cityMinLength')
]

const countryRules = [
  (v: string) => !!v || t('sites.validation.countryRequired'),
  (v: string) => v.length >= 2 || t('sites.validation.countryMinLength')
]

// Watch for prop changes to populate form
watch(() => props.site, (newSite) => {
  if (newSite) {
    formData.name = newSite.name
    formData.address = newSite.address
    formData.postal_code = newSite.postal_code
    formData.city = newSite.city
    formData.country = newSite.country
    formData.note = newSite.note || ''
  }
}, { immediate: true })

const handleSubmit = async (): Promise<void> => {
  const { valid } = await form.value.validate()
  
  if (!valid) return
  
  const submitData = isEdit.value
    ? { ...formData, site_id: props.site!.site_id! } as UpdateSiteRequest
    : formData as CreateSiteRequest
    
  emit('submit', submitData)
}

const handleCancel = (): void => {
  emit('cancel')
}

const resetForm = (): void => {
  formData.name = ''
  formData.address = ''
  formData.postal_code = ''
  formData.city = ''
  formData.country = ''
  formData.note = ''
  form.value?.resetValidation()
}

// Expose reset method for parent component
defineExpose({
  resetForm
})
</script>

<style scoped>
.site-form {
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
