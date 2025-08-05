<template>
  <v-app :theme="theme">
    <v-progress-linear
      v-if="loadingStore.isRouteLoading"
      color="primary"
      height="4"
      indeterminate
      absolute
      top
    />

    <!-- App Bar -->
    <v-app-bar
      v-if="authStore.isAuthenticated"
      color="primary"
      app
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <!--      <v-toolbar-title class="text-h6 font-weight-bold">-->
      <!--        eh-systemhaus-->
      <!--      </v-toolbar-title>-->
      <v-spacer />

      <!-- Language selector -->
      <LanguageSelector />

      <!-- Theme toggle -->
      <!-- <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
      </v-btn> -->

      <!-- User menu -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            class="ml-2"
          >
            <v-icon
              class="mr-3"
              size="36"
              left
            >
              mdi-account-circle
            </v-icon>
            {{ authStore.userFullName }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>
              <v-icon left>
                mdi-logout
              </v-icon>
              {{ $t('navigation.logout') }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-if="authStore.isAuthenticated"
      v-model="drawer"
      app
      :color="theme === 'light' ? 'background' : 'background'"
    >
      <v-container
        class="d-flex justify-center align-center"
        style="height: 100px"
      >
        <v-img
          src="fleeton_main.png"
          width="100"
          height="100"
        />
      </v-container>
      <v-list>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          link
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
            <component
              :is="Component"
              :key="$route.fullPath"
            />
          </transition>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { useLoadingStore } from '@/stores/loading'
const loadingStore = useLoadingStore()
interface NavigationItem {
  title: string
  icon: string
  to: string
}

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const drawer = ref<boolean>(true)
const theme = ref<'light' | 'dark'>('light')

// Navigation items with translations
const navigationItems = computed((): NavigationItem[] => [
  { title: t('navigation.dashboard'), icon: 'mdi-view-dashboard', to: '/dashboard' },
  { title: t('navigation.sites'), icon: 'mdi-map-marker', to: '/sites' },
  { title: t('navigation.chargePoints'), icon: 'mdi-ev-station', to: '/charge-points' },
  { title: t('navigation.connectors'), icon: 'mdi-power-plug', to: '/connectors' },
  {
    title: t('navigation.chargingProfiles'),
    icon: 'mdi-chart-timeline-variant',
    to: '/charging-profiles'
  },
  { title: t('navigation.schedulePeriods'), icon: 'mdi-clock-outline', to: '/schedule-periods' }
])

// Toggle between light and dark theme
const toggleTheme = (): void => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.body.className = theme.value === 'light' ? 'light-mode' : 'dark-mode'
}

// Logout function
const logout = async (): Promise<void> => {
  await authStore.logout()
  router.push('/login')
}

// Initialize auth state on app startup
onMounted(async (): Promise<void> => {
  await authStore.initAuth()
  // Set initial theme class
  document.body.className = theme.value === 'light' ? 'light-mode' : 'dark-mode'
})
</script>

<style>
@import './assets/css/variables.css';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark mode header enhancement */
.v-theme--dark .v-app-bar {
  background-color: rgb(18, 18, 18) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.v-theme--dark .v-app-bar .v-toolbar__content {
  background-color: rgb(18, 18, 18) !important;
}

/* Enhanced contrast for navigation drawer in dark mode */
.v-theme--dark .v-navigation-drawer {
  background-color: rgb(24, 24, 24) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

/* Better table header styling in dark mode */
.v-theme--dark .v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  background-color: rgb(30, 30, 30) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.v-theme--dark .v-data-table > .v-data-table__wrapper > table > tbody > tr:nth-child(odd) {
  background-color: rgba(255, 255, 255, 0.02);
}

/* Better card backgrounds in dark mode */
.v-theme--dark .v-card {
  background-color: rgb(28, 28, 28) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
