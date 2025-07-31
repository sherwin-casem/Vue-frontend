<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        variant="text"
        :title="$t('language.selectLanguage')"
      >
        <v-icon>mdi-translate</v-icon>
      </v-btn>
    </template>
    
    <v-list density="compact" min-width="160">
      <v-list-subheader>{{ $t('language.selectLanguage') }}</v-list-subheader>
      
      <v-list-item
        v-for="locale in supportedLocales"
        :key="locale"
        :value="locale"
        @click="changeLanguage(locale)"
        :class="{ 'active-language': currentLocale === locale }"
      >
        <template v-slot:prepend>
          <v-icon 
            v-if="currentLocale === locale" 
            color="primary"
            size="small"
          >
            mdi-check
          </v-icon>
          <span v-else class="language-flag">{{ getLanguageFlag(locale) }}</span>
        </template>
        
        <v-list-item-title>{{ getLanguageName(locale) }}</v-list-item-title>
        
        <template v-slot:append>
          <v-chip
            v-if="currentLocale === locale"
            size="x-small"
            color="primary"
            variant="tonal"
          >
            {{ $t('language.currentLanguage') }}
          </v-chip>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, LOCALE_NAMES, setLocale, getCurrentLocale, type SupportedLocale } from '@/i18n'

const { locale } = useI18n()

const currentLocale = computed(() => getCurrentLocale())
const supportedLocales = computed(() => SUPPORTED_LOCALES)

const getLanguageName = (locale: SupportedLocale): string => {
  return LOCALE_NAMES[locale]
}

const getLanguageFlag = (locale: SupportedLocale): string => {
  const flags: Record<SupportedLocale, string> = {
    en: '🇺🇸',
    de: '🇩🇪',
    es: '🇪🇸',
    ru: '🇷🇺',
    fr: '🇫🇷'
  }
  return flags[locale]
}

const changeLanguage = (newLocale: SupportedLocale): void => {
  setLocale(newLocale)
  window.location.reload()
}
</script>

<style scoped>
.active-language {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.language-flag {
  font-size: 1.2em;
  margin-right: 8px;
  margin-left: 4px;
}
</style>
