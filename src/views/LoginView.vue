<template>
  <div class="login-container">
    <v-card
      class="login-card"
      elevation="8"
      :theme="theme"
    >
      <v-card-item class="text-center">
        <div class="d-flex flex-column align-center mb-6">
          <!-- Logo placeholder - in production, use actual logo -->
          <div class="w-50 pt-6 pb-6">
            <v-img
              alt="FLEET Velia logo"
              src="fleeton_login.png"
              class="w-100"
              cover
            />
          </div>
          <!-- <h1 class="text-h4 font-weight-bold primary--text">FLEET Velia</h1> -->
        </div>
      </v-card-item>

      <v-card-text>
        <v-form
          ref="form"
          @submit.prevent="handleLogin"
        >
          <v-text-field
            v-model="username"
            :label="$t('auth.username')"
            prepend-inner-icon="mdi-account"
            type="text"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            :disabled="authStore.loading"
          />

          <v-text-field
            v-model="password"
            :label="$t('auth.password')"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showPassword ? 'text' : 'password'"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-2"
            :disabled="authStore.loading"
            @click:append-inner="showPassword = !showPassword"
          />


          <v-alert
            v-if="authStore.error"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="authStore.clearError()"
          >
            {{ authStore.error }}
          </v-alert>

          <v-btn
            block
            color="primary"
            size="large"
            type="submit"
            :loading="authStore.loading"
            :disabled="authStore.loading || !username || !password"
          >
            {{ $t('auth.loginButton') }}
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-text class="text-center text-caption text-medium-emphasis">
        {{ $t('auth.copyright', { year: new Date().getFullYear() }) }}
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

interface ValidationRule {
  (value: string): boolean | string
}

interface ValidationRules {
  required: ValidationRule
}

interface FormRef {
  validate(): Promise<{ valid: boolean }>
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()
const form = ref<FormRef | null>(null)

// Form data
const username = ref<string>('')
const password = ref<string>('')
const showPassword = ref<boolean>(false)
const theme = ref<'light' | 'dark'>('light')

// Form validation rules
const rules: ValidationRules = {
  required: (v: string) => !!v || t('auth.fieldRequired')
}

// Handle login form submission
const handleLogin = async (): Promise<void> => {
  if (!form.value) return

  const { valid } = await form.value.validate()

  if (valid) {
    const result = await authStore.login(username.value, password.value)

    if (result.success) {
      // Redirect to the originally requested page or dashboard
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      router.push(redirectPath)
    }
    // Error handling is done in the store and displayed via the error alert
  }
}

// Check if user is already logged in
onMounted((): void => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }

  // Get theme from body class
  theme.value = document.body.classList.contains('dark-mode') ? 'dark' : 'light'
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  background-color: var(--surface-color);
}

.logo-container {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-mint-white);
}

@media (max-width: 600px) {
  .login-card {
    max-width: 100%;
  }
}
</style>
