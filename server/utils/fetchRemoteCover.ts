import { MAX_COVER_FILE_BYTES, detectCoverMedia } from '~~/shared/utils/cover-media'

const MAX_REDIRECTS = 3
const REQUEST_TIMEOUT_MS = 12_000

export interface RemoteCover {
  bytes: Uint8Array<ArrayBuffer>
  contentType: string
  fileName: string
  media: NonNullable<ReturnType<typeof detectCoverMedia>>
}

export async function fetchRemoteCover(input: string, fetcher: typeof fetch = fetch): Promise<RemoteCover> {
  let url = validateRemoteCoverUrl(input)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    let response: Response | undefined
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      response = await fetcher(url, { redirect: 'manual', signal: controller.signal })
      if (![301, 302, 303, 307, 308].includes(response.status)) break

      const location = response.headers.get('location')
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error('The cover URL redirects too many times.')
      }
      url = validateRemoteCoverUrl(new URL(location, url).toString())
    }

    if (!response?.ok) throw new Error('The cover URL could not be downloaded.')

    const contentType = (response.headers.get('content-type') || '').split(';', 1)[0]?.trim().toLowerCase() ?? ''
    if (!contentType.startsWith('image/')) throw new Error('The URL must point to a supported image.')

    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength > MAX_COVER_FILE_BYTES) throw new Error('The cover file exceeds the 25 MB limit.')

    const chunks: Uint8Array[] = []
    let totalBytes = 0
    const reader = response.body?.getReader()
    if (!reader) throw new Error('The cover URL returned an empty response.')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > MAX_COVER_FILE_BYTES) {
        await reader.cancel()
        throw new Error('The cover file exceeds the 25 MB limit.')
      }
      chunks.push(value)
    }

    const bytes = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }

    const fileName = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'cover')
    const media = detectCoverMedia(contentType, bytes, fileName)
    if (!media || media.kind === 'video') throw new Error('The URL must point to a supported image.')

    return { bytes, contentType: media.contentType, fileName, media }
  } finally {
    clearTimeout(timer)
  }
}

export function validateRemoteCoverUrl(input: string): string {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error('Enter a valid HTTPS image URL.')
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  const isIpLiteral = hostname.startsWith('[') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  const isLocalName = hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.test')

  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || isIpLiteral || isLocalName) {
    throw new Error('Only public HTTPS image URLs are allowed.')
  }

  return url.toString()
}
