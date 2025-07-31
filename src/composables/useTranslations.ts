import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Composable for commonly used translations across components
 * This helps ensure consistency and reduces duplication
 */
export function useTranslations() {
  const { t } = useI18n()

  // Common actions
  const actions = computed(() => ({
    save: t('common.save'),
    cancel: t('common.cancel'),
    delete: t('common.delete'),
    edit: t('common.edit'),
    add: t('common.add'),
    create: t('common.create'),
    update: t('common.update'),
    close: t('common.close'),
    view: t('common.view'),
    search: t('common.search'),
    filter: t('common.filter'),
    export: t('common.export'),
    confirm: t('common.confirm'),
  }))

  // Common status labels
  const status = computed(() => ({
    loading: t('common.loading'),
    error: t('common.error'),
    success: t('common.success'),
    warning: t('common.warning'),
    info: t('common.info'),
    active: t('common.active'),
    inactive: t('common.inactive'),
    faulty: t('common.faulty'),
  }))

  // Common form labels
  const form = computed(() => ({
    required: t('common.required'),
    optional: t('common.optional'),
    note: t('common.note'),
    notes: t('common.notes'),
    created: t('common.created'),
    updated: t('common.updated'),
    actions: t('common.actions'),
    status: t('common.status'),
    total: t('common.total'),
    selected: t('common.selected'),
    of: t('common.of'),
    groupBy: t('common.groupBy'),
    all: t('common.all'),
  }))

  // Common validation messages
  const validation = computed(() => ({
    required: (field: string) => t('validation.fieldRequired', { field }),
    minLength: (field: string, min: number) => t('validation.minLength', { field, min }),
    maxLength: (field: string, max: number) => t('validation.maxLength', { field, max }),
    email: t('validation.emailFormat'),
    number: t('validation.numberFormat'),
    url: t('validation.urlFormat'),
  }))

  // Export functionality
  const exportOptions = computed(() => ({
    exportToPdf: t('export.exportToPdf'),
    exportToExcel: t('export.exportToExcel'),
    exportToCsv: t('export.exportToCsv'),
    generatedOn: (date: string) => t('export.generatedOn', { date }),
    totalItems: (type: string, count: number) => t('export.totalItems', { type, count }),
  }))

  // Table functionality
  const table = computed(() => ({
    itemsPerPage: t('table.itemsPerPage'),
    of: t('table.of'),
    page: t('table.page'),
    noData: t('table.noData'),
    loading: t('table.loading'),
    itemsSelected: (count: number, total: number) => t('table.itemsSelected', { count, total }),
    totalItems: (count: number) => t('table.totalItems', { count }),
  }))

  // Authentication
  const auth = computed(() => ({
    username: t('auth.username'),
    password: t('auth.password'),
    login: t('auth.login'),
    loginButton: t('auth.loginButton'),
    logout: t('navigation.logout'),
    forgotPassword: t('auth.forgotPassword'),
    fieldRequired: t('auth.fieldRequired'),
    invalidCredentials: t('auth.invalidCredentials'),
    loginRequired: t('auth.loginRequired'),
    loginError: t('auth.loginError'),
    networkError: t('auth.networkError'),
  }))

  // Navigation
  const navigation = computed(() => ({
    dashboard: t('navigation.dashboard'),
    sites: t('navigation.sites'),
    chargePoints: t('navigation.chargePoints'),
    chargingProfiles: t('navigation.chargingProfiles'),
    tariffManagement: t('navigation.tariffManagement'),
    logout: t('navigation.logout'),
  }))

  // Generic confirmation dialogs
  const confirmDelete = (itemName: string) => 
    t('common.confirmDelete', { name: itemName })

  // Generic success messages
  const successMessage = (action: string, itemName: string) => 
    t('common.successMessage', { action, name: itemName })

  // Generic error messages
  const errorMessage = (action: string) => 
    t('common.errorMessage', { action })

  // Helper function to get all available localized status options
  const statusOptions = computed(() => [
    { title: status.value.active, value: 'active' },
    { title: status.value.inactive, value: 'inactive' },
    { title: status.value.faulty, value: 'faulty' },
  ])

  return {
    // Core translation function
    t,
    
    // Grouped translations
    actions,
    status,
    form,
    validation,
    exportOptions,
    table,
    auth,
    navigation,
    
    // Helper functions
    confirmDelete,
    successMessage,
    errorMessage,
    statusOptions,
  }
}

/**
 * Common validation rules using translations
 */
export function useValidationRules() {
  const { t } = useI18n()

  return {
    required: (v: any) => !!v || t('auth.fieldRequired'),
    minLength: (min: number) => (v: string) => 
      (v && v.length >= min) || t('validation.minLength', { min }),
    maxLength: (max: number) => (v: string) => 
      (!v || v.length <= max) || t('validation.maxLength', { max }),
    email: (v: string) => 
      !v || /.+@.+\..+/.test(v) || t('validation.emailFormat'),
    number: (v: string) => 
      !v || !isNaN(Number(v)) || t('validation.numberFormat'),
    url: (v: string) => 
      !v || /^https?:\/\/.+/.test(v) || t('validation.urlFormat'),
  }
}
