import { collectScheduledPostMediaDeletions } from '~~/server/utils/postMediaGc'
import { collectScheduledPostBlobPurges } from '~~/server/utils/postBlobGc'
import { pruneExpiredPostRevisions } from '~~/server/utils/postRevisions'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async ({ controller }) => {
    if (controller.cron !== '0 * * * *') return

    const revisions = await pruneExpiredPostRevisions()
    const result = await collectScheduledPostMediaDeletions()
    const postBlobPurges = await collectScheduledPostBlobPurges()
    console.info('[postMediaGc] Scheduled cleanup completed', {
      revisions,
      media: result,
      posts: postBlobPurges,
    })
  })
})
