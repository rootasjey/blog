import { blob } from 'hub:blob'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const HOME_AVATAR_FOLDER = 'site/home/identity'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (session.user.role !== 'admin') return apiError(event, 403, 'FORBIDDEN', 'Admin access required')

    const formData = await readMultipartFormData(event)
    const file = formData?.find(item => item.name === 'file')
    if (!file?.data?.length) return apiError(event, 400, 'VALIDATION_ERROR', 'Image file is required')
    if (!ACCEPTED_TYPES.includes(file.type || '')) return apiError(event, 400, 'VALIDATION_ERROR', 'Use a JPEG, PNG, or WebP image')
    if (file.data.length > MAX_UPLOAD_BYTES) return apiError(event, 413, 'UPLOAD_TOO_LARGE', 'Image must be 8 MB or smaller')

    const { Jimp } = await import('jimp')
    const image = await Jimp.fromBuffer(file.data)
    image.scaleToFit({ w: 640, h: 640 })
    const buffer = await image.getBuffer('image/jpeg', { quality: 86 })
    const avatarPath = `${HOME_AVATAR_FOLDER}/${crypto.randomUUID()}.jpg`
    await blob.put(avatarPath, new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }), { addRandomSuffix: false })

    return apiCreated(event, { src: `/${avatarPath}` })
  } catch (err: any) {
    console.error('[API] POST /admin/site-settings/home-avatar error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to upload home avatar')
  }
})
