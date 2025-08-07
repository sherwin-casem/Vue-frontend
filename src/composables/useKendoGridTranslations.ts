import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Composable that provides comprehensive Kendo Grid translations
 * This ensures all grids in the application use consistent translations
 */
export function useKendoGridTranslations() {
  const { t, locale } = useI18n()

  const messages = computed(() => {
    const msgs = {
      // Basic Grid Messages
      noRecords: t('kendo.grid.noRecords'),
      loading: t('kendo.grid.loading'),

      // Grouping
      groupPanelEmpty: t('kendo.grouping.empty'),

      // Filter operators (most commonly used)
      filterEqOperator: t('kendo.grid.filterEqOperator'),
      filterNotEqOperator: t('kendo.grid.filterNotEqOperator'),
      filterContainsOperator: t('kendo.grid.filterContainsOperator'),
      filterStartsWithOperator: t('kendo.grid.filterStartsWithOperator'),
      filterEndsWithOperator: t('kendo.grid.filterEndsWithOperator'),
      filterIsNullOperator: t('kendo.grid.filterIsNullOperator'),
      filterIsNotNullOperator: t('kendo.grid.filterIsNotNullOperator'),
      filterIsEmptyOperator: t('kendo.grid.filterIsEmptyOperator'),
      filterIsNotEmptyOperator: t('kendo.grid.filterIsNotEmptyOperator'),
      filterGteOperator: t('kendo.grid.filterGteOperator'),
      filterGtOperator: t('kendo.grid.filterGtOperator'),
      filterLteOperator: t('kendo.grid.filterLteOperator'),
      filterLtOperator: t('kendo.grid.filterLtOperator'),

      // Filter logic
      filterAndLogic: t('kendo.grid.filterAndLogic'),
      filterOrLogic: t('kendo.grid.filterOrLogic'),
      filterClear: t('kendo.grid.filterClear'),
      filterApply: t('kendo.grid.filterApply'),

      // Sorting
      sortAscending: t('kendo.grid.sortAscending'),
      sortDescending: t('kendo.grid.sortDescending')
    }

    console.log('Current locale:', locale.value, 'Messages:', msgs)
    return msgs
  })

  return {
    messages
  }
}
