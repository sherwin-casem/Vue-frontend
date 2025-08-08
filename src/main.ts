import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import './assets/css/variables.css'
import './assets/css/kendo-pagination-focus.css'
import '@progress/kendo-theme-default/dist/all.css'
import { translationDevPlugin, vTranslatable } from './plugins/translationDev'

// Fix ResizeObserver errors that cause performance issues
import './utils/resizeObserverFix'
import installKendoLicense from './plugins/kendo-license'

// Install Kendo license
installKendoLicense()

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#3B82F6', // Blue (Charts, Active)
          secondary: '#64748B', // Slate Gray (Sidebar)
          accent: '#6366F1', // Indigo (Highlights)
          error: '#EF4444', // Red (Error / KPI drop)
          info: '#14B8A6', // Teal (Info / Status)
          background: '#F9FAFB', // Page background
          surface: '#FFFFFF' // Cards, panels
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#3B82F6', // Blue
          secondary: '#64748B', // Slate Gray
          accent: '#6366F1', // Indigo
          error: '#EF4444', // Red
          info: '#14B8A6', // Teal
          background: '#0D1117', // Deep navy for page
          surface: '#161B22' // Panels / Cards
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(vuetify)

// Development-only translation helpers - temporarily disabled to fix setup errors
app.use(translationDevPlugin, {
  enabled: false, // Disabled until Vue setup issues are resolved
  autoCheck: false,
  checkInterval: 0,
  showNotifications: false
})

app.directive('translatable', vTranslatable)

app.mount('#app')
