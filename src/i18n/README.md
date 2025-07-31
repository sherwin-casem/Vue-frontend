# Translation System Documentation

This application features a comprehensive multi-language translation system that supports 5 languages with automatic detection, runtime validation, and development tools.

## Supported Languages

- **English (en)** - Default language
- **German (de)** - Deutsch
- **Spanish (es)** - Español  
- **Russian (ru)** - Русский
- **French (fr)** - Français

## Architecture

### Core Components

1. **Vue I18n Integration** (`src/i18n/index.ts`)
   - Auto-detection based on browser language/system locale
   - Persistent language selection in localStorage
   - Fallback to English for missing translations

2. **Translation Files** (`src/i18n/locales/`)
   - Structured JSON files for each language
   - Organized by feature/component sections
   - Comprehensive coverage of UI elements

3. **Translation Composables** (`src/composables/useTranslations.ts`)
   - Reusable translation helpers
   - Common validation rules with i18n
   - Grouped translations for actions, status, forms

4. **Development Tools** (`src/utils/`, `src/plugins/`)
   - Runtime validation and untranslated text detection
   - Auto-translation key generation
   - Console helpers and keyboard shortcuts

## Usage

### Basic Translation

```vue
<template>
  <h1>{{ $t('dashboard.title') }}</h1>
  <button>{{ $t('common.save') }}</button>
  <p>{{ $t('messages.welcome', { name: userName }) }}</p>
</template>
```

### Form Validation with Translations

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const nameRules = [
  (v) => !!v || t('validation.fieldRequired'),
  (v) => v.length >= 3 || t('validation.minLength', { min: 3 })
]
</script>
```

### Status Values Translation

```vue
<template>
  <v-chip :color="getStatusColor(status)">
    {{ $t(`status.${status?.toLowerCase()}`) }}
  </v-chip>
</template>
```

### Using Translation Composables

```vue
<script setup>
import { useTranslations } from '@/composables/useTranslations'

const { 
  commonTranslations,
  actionTranslations, 
  validationRules 
} = useTranslations()
</script>
```

## Translation File Structure

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  },
  "navigation": {
    "dashboard": "Dashboard",
    "sites": "Sites"
  },
  "auth": {
    "login": "Login",
    "username": "Username",
    "password": "Password"
  },
  "sites": {
    "title": "Sites Management",
    "addSite": "Add Site",
    "validation": {
      "nameRequired": "Site name is required"
    }
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "faulty": "Faulty"
  }
}
```

## Language Detection

The system automatically detects the user's preferred language using:

1. **Saved Preference** - Previously selected language from localStorage
2. **Browser Language** - `navigator.language` or `navigator.userLanguage`
3. **Language Mapping** - Maps browser locales to supported languages
4. **Fallback** - Defaults to English if no match found

```typescript
function detectUserLocale(): SupportedLocale {
  // Check saved preference
  const savedLocale = localStorage.getItem('user-locale')
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
    return savedLocale
  }

  // Parse browser language
  const browserLang = navigator.language || navigator.userLanguage
  const langCode = browserLang.split('-')[0]?.toLowerCase()
  
  // Map to supported locale
  return LANGUAGE_MAPPING[langCode] || 'en'
}
```

## Development Tools

### Automatic Translation Checking

When running in development mode, the application automatically:

- Scans for untranslated text every 10 seconds
- Logs potential translation issues to console
- Provides suggestions for translation keys
- Validates that required keys exist

### Manual Checking

```javascript
// Console commands available in development:
window.checkTranslations()  // Run full translation check
```

### Keyboard Shortcuts

- **Ctrl+Shift+T** - Quick translation check

### Translation Validation Utility

```vue
<script setup>
import { useTranslationChecker } from '@/utils/translationValidator'

const { keyExists, safeTranslate, validateFeatureKeys } = useTranslationChecker()

// Check if key exists before using
if (keyExists('sites.title')) {
  const title = safeTranslate('sites.title', 'Default Title')
}

// Validate all required keys for a feature
const missingKeys = validateFeatureKeys('auth', [
  'username', 'password', 'login', 'forgotPassword'
])
</script>
```

## Adding New Translations

### 1. Add to English File First

```json
// src/i18n/locales/en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "Feature description",
    "action": "Do Something"
  }
}
```

### 2. Add to All Language Files

Update corresponding files for `de.json`, `es.json`, `ru.json`, `fr.json`:

```json
// src/i18n/locales/de.json
{
  "newFeature": {
    "title": "Neue Funktion",
    "description": "Funktionsbeschreibung", 
    "action": "Etwas machen"
  }
}
```

### 3. Use in Components

```vue
<template>
  <h2>{{ $t('newFeature.title') }}</h2>
  <p>{{ $t('newFeature.description') }}</p>
  <v-btn>{{ $t('newFeature.action') }}</v-btn>
</template>
```

## Language Selector Component

The `LanguageSelector` component provides:

- Flag icons for each language
- Dropdown selection interface
- Persistent language switching
- Real-time UI updates

```vue
<LanguageSelector />
```

## Best Practices

### 1. Consistent Key Naming

- Use descriptive, hierarchical keys: `feature.component.element`
- Group related translations: `validation.*`, `status.*`, `common.*`
- Use camelCase for multi-word keys: `firstName`, `confirmDelete`

### 2. Parameterized Messages

```vue
<!-- Good -->
{{ $t('messages.welcome', { name: userName, count: itemCount }) }}

<!-- Avoid -->
{{ $t('messages.hello') }} {{ userName }}!
```

### 3. Validation Rules

Always use translation functions in validation:

```javascript
// Good
const rules = [(v) => !!v || t('validation.required')]

// Avoid
const rules = [(v) => !!v || 'This field is required']
```

### 4. Status and Dynamic Content

Use computed translations for dynamic values:

```javascript
const statusText = computed(() => t(`status.${item.status?.toLowerCase()}`))
```

## Troubleshooting

### Missing Translations

1. Check browser console for warnings
2. Run `window.checkTranslations()` in development
3. Verify key exists in all language files
4. Check for typos in translation keys

### Fallback Behavior

- Missing keys display the key name itself
- Console warnings in development mode
- Automatic fallback to English if available

### Performance

- Translations are loaded synchronously at app startup
- All language files are bundled (small overhead)
- Vue I18n provides efficient reactive updates
- Language switching is instant (no API calls)

## API Integration

### Error Messages

Server error messages should be translated:

```typescript
// In API store
try {
  await api.createSite(data)
  showSuccess(t('sites.created', { name: data.name }))
} catch (error) {
  showError(t('sites.createError'))
}
```

### Dynamic Content

For user-generated content that might need translation:

```typescript
// Mixed content approach
const dynamicMessage = computed(() => {
  if (userContent.isTranslatable) {
    return t(userContent.translationKey)
  }
  return userContent.rawText
})
```

## Future Enhancements

### Potential Additions

1. **RTL Language Support** - For Arabic, Hebrew
2. **Date/Number Formatting** - Locale-specific formats  
3. **Pluralization Rules** - Complex plural forms
4. **Lazy Loading** - Load language files on demand
5. **Translation Management** - External translation service integration

### Auto-Translation Service

The system is designed to support automatic translation services:

```typescript
// Future: Auto-translate missing keys
async function autoTranslate(key: string, targetLang: string) {
  const sourceText = t(key, 'en') // Get English version
  const translated = await translationService.translate(sourceText, targetLang)
  return translated
}
```

This translation system ensures a fully internationalized application with excellent developer experience and user accessibility across all supported languages.
