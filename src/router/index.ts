import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy-loaded components
const LoginView = () => import('@/views/LoginView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

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
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // If route requires auth and user is not logged in, redirect to login
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
  // If going to login and already authenticated, redirect to dashboard
  else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
