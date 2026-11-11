import { joinURL } from 'ufo'
import type { ProviderGetImage } from '@nuxt/image'
import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime'

const operationsGenerator = createOperationsGenerator()
const getImage: ProviderGetImage<{ baseURL?: string }> = (src, { modifiers, baseURL }) => {
  const resolvedBaseURL = baseURL || ''
  const operations = operationsGenerator(modifiers).replaceAll(/[/]/g, '&')
  let url = joinURL(resolvedBaseURL, src + (operations ? '?' + operations : ''))

  if (src.startsWith("/projects/") || src.startsWith("/posts/")) {
    const parts = src.split("/")
    const category = parts[1]
    const filename = parts[parts.length - 1]
    let slug = ""
    for (let i = 2; i < parts.length - 1; i++) {
      slug += parts[i]
      if (i < parts.length - 2) { slug += '/' }
    }
    // Use relative URL to avoid mixing origins/ports in dev (works with any base URL)
    url = `/images/${filename}?relatedTo=${category}&slug=${slug}`
    if (operations) {
      url += '&' + operations
    }
  }

  // Avatars (users) also route through /images with category=users
  if (src.startsWith("/users/")) {
    // src = /users/1/avatar/original.png -> /images/original.png?relatedTo=users&slug=1/avatar
    const parts = src.split("/")
    const filename = parts[parts.length - 1]
    let slug = ""
    // Start at i=2 to skip empty string and 'users' segment
    for (let i = 2; i < parts.length - 1; i++) {
      slug += parts[i]
      if (i < parts.length - 2) { slug += '/' }
    }
    url = `/images/${filename}?relatedTo=users&slug=${slug}`
    if (operations) {
      url += '&' + operations
    }
  }

  return { url }
}

export default defineProvider({
  getImage,
})
