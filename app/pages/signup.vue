<template>
  <section class="site-page site-auth-page site-auth-page--signup">
    <section class="site-auth-card" aria-labelledby="auth-title">
      <header class="site-auth-heading">
        <h1 id="auth-title">{{ $t('pages.signup.heading') }}</h1>
        <span>{{ $t('pages.signup.description') }}</span>
      </header>

      <form class="site-auth-form" @submit.prevent="onSubmit">
        <div class="site-auth-field">
          <label class="site-auth-label" for="signup-name">{{ $t('pages.signup.namePlaceholder') }}</label>
          <input
            id="signup-name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            required
            minlength="2"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'signup-name-error' : undefined"
            :placeholder="$t('pages.signup.namePlaceholder')"
          />
          <p v-if="errors.name" id="signup-name-error" class="site-auth-error">{{ errors.name }}</p>
        </div>

        <div class="site-auth-field">
          <label class="site-auth-label" for="signup-email">{{ $t('pages.signup.emailPlaceholder') }}</label>
          <input
            id="signup-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'signup-email-error' : undefined"
            :placeholder="$t('pages.signup.emailPlaceholder')"
          />
          <p v-if="errors.email" id="signup-email-error" class="site-auth-error">{{ errors.email }}</p>
        </div>

        <div class="site-auth-field">
          <label class="site-auth-label" for="signup-password">{{ $t('pages.signup.passwordPlaceholder') }}</label>
          <input
            id="signup-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
            minlength="8"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'signup-password-error' : undefined"
            :placeholder="$t('pages.signup.passwordPlaceholder')"
          />
          <label class="site-auth-checkbox">
            <input type="checkbox" v-model="showPassword" />
            {{ $t('pages.signup.showPassword') }}
          </label>
          <p v-if="errors.password" id="signup-password-error" class="site-auth-error">{{ errors.password }}</p>
        </div>

        <p v-if="errorMessage" class="site-auth-error site-auth-form-error" role="alert">{{ errorMessage }}</p>

        <button class="site-interactive-hover site-outline-action site-auth-submit" :disabled="isSubmitting" type="submit">
          {{ isSubmitting ? $t('pages.signup.submitting') : $t('pages.signup.submit') }}
        </button>
      </form>

      <p class="site-auth-switch">
        {{ $t('pages.signup.hasAccount') }}
        <NuxtLink :to="localizedPath('/signin', $getLocale())">{{ $t('pages.signup.signInLink') }}</NuxtLink>
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const { $t, $getLocale } = useI18n()
const { fetch: refreshSession } = useUserSession()

const form = reactive({
  name: '',
  email: '',
  password: ''
})

const errors = reactive<{ name?: string; email?: string; password?: string }>({})
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

function validate() {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  let ok = true
  if (!form.name || form.name.trim().length < 2) {
    errors.name = $t('pages.signup.nameMinLength')
    ok = false
  }
  if (!form.email) {
    errors.email = $t('pages.signup.emailRequired')
    ok = false
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errors.email = $t('pages.signup.emailValid')
    ok = false
  }
  if (!form.password) {
    errors.password = $t('pages.signup.passwordRequired')
    ok = false
  } else if (form.password.length < 8) {
    errors.password = $t('pages.signup.passwordMinLength')
    ok = false
  }
  return ok
}

async function onSubmit() {
  if (!validate()) return
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/register', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password
      }
    })

    // Refetch session and go home
    await refreshSession()
    navigateTo(localizedPath('/', $getLocale()))
  } catch (e: any) {
    errorMessage.value = e?.data?.message || $t('pages.signup.createFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style src="~/styles/auth-page.css"></style>
