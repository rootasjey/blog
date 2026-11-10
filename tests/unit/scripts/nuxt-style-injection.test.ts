import { describe, expect, it } from 'vitest'
import { isLayeredNuxtStylesheet } from '../../../scripts/nuxt-style-injection'

describe('isLayeredNuxtStylesheet', () => {
  it('recognizes reset and UnaUI styles provided as strings', () => {
    expect(isLayeredNuxtStylesheet('@unocss/reset/tailwind.css')).toBe(true)
    expect(isLayeredNuxtStylesheet('@una-ui/preset/una.css')).toBe(true)
  })

  it('recognizes reset and UnaUI styles provided as Nuxt CSS entries', () => {
    expect(isLayeredNuxtStylesheet({ src: 'node_modules/@unocss/reset/tailwind.css' })).toBe(true)
    expect(isLayeredNuxtStylesheet({ src: 'node_modules/@una-ui/preset/una.css' })).toBe(true)
  })

  it('normalizes Windows paths and leaves unrelated styles untouched', () => {
    expect(isLayeredNuxtStylesheet({ src: 'node_modules\\@una-ui\\preset\\una.css' })).toBe(true)
    expect(isLayeredNuxtStylesheet('./app/styles/main.css')).toBe(false)
    expect(isLayeredNuxtStylesheet({ src: './app/styles/main.css' })).toBe(false)
    expect(isLayeredNuxtStylesheet({})).toBe(false)
  })
})
