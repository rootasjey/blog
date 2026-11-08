export default defineEventHandler(() => {
  throw createError({
    statusCode: 503,
    statusMessage: 'Donations are not available yet.',
  })
})
