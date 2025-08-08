import { computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { LocalizationProvider, IntlProvider, loadMessages, load } from '@progress/kendo-vue-intl'
import { getCurrentLocale, type SupportedLocale } from '@/i18n'

// CLDR imports for all supported locales
import likelySubtags from 'cldr-core/supplemental/likelySubtags.json'
import currencyData from 'cldr-core/supplemental/currencyData.json'
import weekData from 'cldr-core/supplemental/weekData.json'

// German CLDR data
import numbersDE from 'cldr-numbers-full/main/de/numbers.json'
import currenciesDE from 'cldr-numbers-full/main/de/currencies.json'
import caGregorianDE from 'cldr-dates-full/main/de/ca-gregorian.json'
import dateFieldsDE from 'cldr-dates-full/main/de/dateFields.json'
import timeZoneNamesDE from 'cldr-dates-full/main/de/timeZoneNames.json'

// Spanish CLDR data
import numbersES from 'cldr-numbers-full/main/es/numbers.json'
import currenciesES from 'cldr-numbers-full/main/es/currencies.json'
import caGregorianES from 'cldr-dates-full/main/es/ca-gregorian.json'
import dateFieldsES from 'cldr-dates-full/main/es/dateFields.json'
import timeZoneNamesES from 'cldr-dates-full/main/es/timeZoneNames.json'

// French CLDR data
import numbersFR from 'cldr-numbers-full/main/fr/numbers.json'
import currenciesFR from 'cldr-numbers-full/main/fr/currencies.json'
import caGregorianFR from 'cldr-dates-full/main/fr/ca-gregorian.json'
import dateFieldsFR from 'cldr-dates-full/main/fr/dateFields.json'
import timeZoneNamesFR from 'cldr-dates-full/main/fr/timeZoneNames.json'

// Russian CLDR data
import numbersRU from 'cldr-numbers-full/main/ru/numbers.json'
import currenciesRU from 'cldr-numbers-full/main/ru/currencies.json'
import caGregorianRU from 'cldr-dates-full/main/ru/ca-gregorian.json'
import dateFieldsRU from 'cldr-dates-full/main/ru/dateFields.json'
import timeZoneNamesRU from 'cldr-dates-full/main/ru/timeZoneNames.json'

// English CLDR data (fallback)
import numbersEN from 'cldr-numbers-full/main/en/numbers.json'
import currenciesEN from 'cldr-numbers-full/main/en/currencies.json'
import caGregorianEN from 'cldr-dates-full/main/en/ca-gregorian.json'
import dateFieldsEN from 'cldr-dates-full/main/en/dateFields.json'
import timeZoneNamesEN from 'cldr-dates-full/main/en/timeZoneNames.json'

// Load base CLDR data
load(likelySubtags, currencyData, weekData)

// Load locale-specific CLDR data
const loadCLDRForLocale = (locale: SupportedLocale) => {
  switch (locale) {
    case 'de':
      load(numbersDE, currenciesDE, caGregorianDE, dateFieldsDE, timeZoneNamesDE)
      break
    case 'es':
      load(numbersES, currenciesES, caGregorianES, dateFieldsES, timeZoneNamesES)
      break
    case 'fr':
      load(numbersFR, currenciesFR, caGregorianFR, dateFieldsFR, timeZoneNamesFR)
      break
    case 'ru':
      load(numbersRU, currenciesRU, caGregorianRU, dateFieldsRU, timeZoneNamesRU)
      break
    case 'en':
    default:
      load(numbersEN, currenciesEN, caGregorianEN, dateFieldsEN, timeZoneNamesEN)
      break
  }
}

/**
 * Composable for Kendo Grid globalization
 * Provides localization support for Kendo UI Grid components
 * Integrates with the existing Vue i18n translation system
 */
export function useKendoGridGlobalization() {
  const { t } = useI18n()
  const currentLocale = computed(() => getCurrentLocale())

  // Kendo UI locale mappings (Kendo uses different locale format)
  const kendoLocaleMap: Record<SupportedLocale, string> = {
    en: 'en-US',
    de: 'de-DE',
    es: 'es-ES',
    fr: 'fr-FR',
    ru: 'ru-RU'
  }

  // Get Kendo locale identifier
  const kendoLocale = computed(() => kendoLocaleMap[currentLocale.value] || 'en-US')

  // Grid messages for each locale using existing translations
  const gridMessages = computed(() => ({
    grid: {
      // Group panel
      groupPanelEmpty: t('kendo.grid.groupByMessage'),

      // Data states
      noRecords: t('kendo.grid.noRecords'),
      loading: t('kendo.grid.loading'),

      // Pagination
      pagerFirstPage: t('kendo.grid.first'),
      pagerPreviousPage: t('kendo.grid.previous'),
      pagerNextPage: t('kendo.grid.next'),
      pagerLastPage: t('kendo.grid.last'),
      pagerPage: t('kendo.grid.page'),
      pagerOf: t('kendo.grid.of'),
      pagerItems: t('kendo.grid.items'),
      pagerInfo: `{0} - {1} ${t('kendo.grid.of')} {2} ${t('kendo.grid.items')}`,
      pagerItemsPerPage: t('kendo.grid.itemsPerPage'),

      // Filter operators - text
      filterEqOperator: t('kendo.grid.filterEqOperator'),
      filterNotEqOperator: t('kendo.grid.filterNotEqOperator'),
      filterIsNullOperator: t('kendo.grid.filterIsNullOperator'),
      filterIsNotNullOperator: t('kendo.grid.filterIsNotNullOperator'),
      filterIsEmptyOperator: t('kendo.grid.filterIsEmptyOperator'),
      filterIsNotEmptyOperator: t('kendo.grid.filterIsNotEmptyOperator'),
      filterStartsWithOperator: t('kendo.grid.filterStartsWithOperator'),
      filterContainsOperator: t('kendo.grid.filterContainsOperator'),
      filterNotContainsOperator: t('kendo.grid.filterNotContainsOperator'),
      filterEndsWithOperator: t('kendo.grid.filterEndsWithOperator'),

      // Filter operators - numeric
      filterGteOperator: t('kendo.grid.filterGteOperator'),
      filterGtOperator: t('kendo.grid.filterGtOperator'),
      filterLteOperator: t('kendo.grid.filterLteOperator'),
      filterLtOperator: t('kendo.grid.filterLtOperator'),

      // Filter operators - boolean
      filterIsTrue: t('common.yes'),
      filterIsFalse: t('common.no'),
      filterBooleanAll: `(${t('common.all')})`,

      // Filter operators - date
      filterAfterOrEqualOperator: t('kendo.grid.filterAfterOrEqualOperator'),
      filterAfterOperator: t('kendo.grid.filterAfterOperator'),
      filterBeforeOperator: t('kendo.grid.filterBeforeOperator'),
      filterBeforeOrEqualOperator: t('kendo.grid.filterBeforeOrEqualOperator'),

      // Filter actions
      filterFilterButton: t('common.filter'),
      filterClearButton: t('common.clearFilter'),
      filterAndLogic: t('kendo.grid.filterAndLogic'),
      filterOrLogic: t('kendo.grid.filterOrLogic'),

      // Column menu
      sortAscending: t('kendo.grid.sortAscending'),
      sortDescending: t('kendo.grid.sortDescending'),
      columns: t('kendo.grid.columns'),
      filter: t('kendo.grid.filter'),

      // Grouping
      unGroup: t('kendo.grid.unGroup'),
      groupBy: t('common.groupBy')
    }
  }))

  // Load messages for current locale
  const loadGridMessages = () => {
    loadMessages(gridMessages.value, kendoLocale.value)
  }

  // Load CLDR data for current locale
  const loadCLDRData = () => {
    loadCLDRForLocale(currentLocale.value)
  }

  // Watch for locale changes and reload data
  watch(
    currentLocale,
    () => {
      loadCLDRData()
      loadGridMessages()
    },
    { immediate: true }
  )

  // Initialize on mount
  onMounted(() => {
    loadCLDRData()
    loadGridMessages()
  })

  // Provider components
  const KendoLocalizationProvider = LocalizationProvider
  const KendoIntlProvider = IntlProvider

  return {
    kendoLocale,
    gridMessages,
    KendoLocalizationProvider,
    KendoIntlProvider,
    loadGridMessages,
    loadCLDRData
  }
}

export { LocalizationProvider, IntlProvider }
