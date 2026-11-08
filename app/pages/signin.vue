<template>
  <section class="site-page site-auth-page">
    <section class="site-auth-card" aria-labelledby="auth-title">
      <header class="site-auth-heading">
        <h1 id="auth-title">{{ $t('pages.signin.heading') }}</h1>
        <span>{{ $t('pages.signin.description') }}</span>
      </header>

      <form class="site-auth-form" @submit.prevent="onSubmit">
        <div class="site-auth-field">
          <label class="site-auth-label" for="signin-email">{{ $t('pages.signin.emailPlaceholder') }}</label>
          <input
            id="signin-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'signin-email-error' : undefined"
            :placeholder="$t('pages.signin.emailPlaceholder')"
          />
          <p v-if="errors.email" id="signin-email-error" class="site-auth-error">{{ errors.email }}</p>
        </div>

        <div class="site-auth-field">
          <label class="site-auth-label" for="signin-password">{{ $t('pages.signin.passwordPlaceholder') }}</label>
          <input
            id="signin-password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'signin-password-error' : undefined"
            :placeholder="$t('pages.signin.passwordPlaceholder')"
          />
          <p v-if="errors.password" id="signin-password-error" class="site-auth-error">{{ errors.password }}</p>
        </div>

        <p v-if="errorMessage" class="site-auth-error site-auth-form-error" role="alert">{{ errorMessage }}</p>

        <button class="site-interactive-hover site-outline-action site-auth-submit" :disabled="isSubmitting" type="submit">
          {{ isSubmitting ? $t('pages.signin.submitting') : $t('pages.signin.submit') }}
        </button>
      </form>

      <p class="site-auth-switch">
        {{ $t('pages.signin.noAccount') }}
        <NuxtLink :to="localizedPath('/signup', $getLocale())">{{ $t('pages.signin.signUpLink') }}</NuxtLink>
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { $t, $getLocale } = useI18n()

const { fetch: refreshSession } = useUserSession()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})
const isSubmitting = ref(false)
const errorMessage = ref('')

function validate() {
  errors.email = ''
  if (!form.email) {
    errors.email = $t('pages.signin.emailRequired')
    return false
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errors.email = $t('pages.signin.emailValid')
    return false
  }
  if (!form.password) {
    errors.password = $t('pages.signin.passwordRequired')
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return
  isSubmitting.value = true

  errorMessage.value = ''
  try {
    await $fetch('/api/login', {
      method: 'POST',
      body: { email: form.email, password: form.password }
    })

    // Refresh session and navigate
    await refreshSession()
    router.push(localizedPath('/', $getLocale()))
  } catch (e: any) {
    errorMessage.value = e?.data?.message || $t('pages.signin.invalidCredentials')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style src="~/styles/auth-page.css"></style>
