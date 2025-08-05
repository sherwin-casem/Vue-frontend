import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import SitesView from '@/views/SitesView.vue'
import ChargePointsView from '@/views/ChargePointsView.vue'
import ConnectorsView from '@/views/ConnectorsView.vue'
import SchedulePeriodsView from '@/views/SchedulePeriodsView.vue'
import ChargingProfilesView from '@/views/ChargingProfilesView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { useLoadingStore } from '@/stores/loading'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/sites',
    name: 'sites',
    component: SitesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/charge-points',
    name: 'chargepoints',
    component: ChargePointsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/connectors',
    name: 'connectors',
    component: ConnectorsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule-periods',
    name: 'scheduleperiods',
    component: SchedulePeriodsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/charging-profiles',
    name: 'chargingprofiles',
    component: ChargingProfilesView,
    meta: { requiresAuth: true }
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFoundView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const loadingStore = useLoadingStore()

  loadingStore.start()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})


router.afterEach(() => {
  const loadingStore = useLoadingStore()
  loadingStore.stop()
})

export default router
