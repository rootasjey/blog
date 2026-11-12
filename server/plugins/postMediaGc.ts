import { collectScheduledPostMediaDeletions } from '~~/server/utils/postMediaGc'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ controller }) => {
    if (controller.cron !== '0 * * * *') return

    const result = await collectScheduledPostMediaDeletions()
    console.info('[postMediaGc] Scheduled cleanup completed', result)
  })
})
