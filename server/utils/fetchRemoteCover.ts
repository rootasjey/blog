import { MAX_COVER_FILE_BYTES, detectCoverMedia } from '~~/shared/utils/cover-media'

const MAX_REDIRECTS = 3
const REQUEST_TIMEOUT_MS = 12_000

export interface RemoteCover {
  bytes: Uint8Array<ArrayBuffer>
  contentType: string
  fileName: string
  media: NonNullable<ReturnType<typeof detectCoverMedia>>
}

export interface SameSiteImageBlobSource {
  fileName: string
  blobPath: string
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
    return inspectRemoteCover(bytes, contentType, fileName)
  } finally {
    clearTimeout(timer)
  }
}

export function inspectRemoteCover(bytes: Uint8Array<ArrayBuffer>, contentType: string, fileName: string): RemoteCover {
  const media = detectCoverMedia(contentType, bytes, fileName)
  if (!media || media.kind === 'video') throw new Error('The URL must point to a supported image.')

  return { bytes, contentType: media.contentType, fileName, media }
}

export function getSameSiteImageBlobSource(input: string, siteUrl: string): SameSiteImageBlobSource | null {
  let url: URL
  let site: URL
  try {
    url = new URL(input)
    site = new URL(siteUrl)
  } catch {
    return null
  }

  if (url.origin !== site.origin || url.username || url.password) return null

  const imagePrefix = '/images/'
  if (!url.pathname.startsWith(imagePrefix)) return null

  const encodedFileName = url.pathname.slice(imagePrefix.length)
  if (!encodedFileName || encodedFileName.includes('/')) return null

  let fileName: string
  try {
    fileName = decodeURIComponent(encodedFileName)
  } catch {
    return null
  }

  if (!fileName || fileName === '.' || fileName === '..' || fileName.includes('/') || fileName.includes('\\')) return null

  const relatedToValues = url.searchParams.getAll('relatedTo')
  const slugValues = url.searchParams.getAll('slug')
  const relatedTo = relatedToValues[0]
  const slug = slugValues[0]
  if (relatedToValues.length !== 1 || slugValues.length !== 1 || !relatedTo || !slug) return null
  if (!['posts', 'projects', 'users'].includes(relatedTo)) return null

  const slugSegments = slug.split('/')
  if (slugSegments.some(segment => !segment || segment === '.' || segment === '..' || /[\\\u0000-\u001f]/.test(segment))) return null

  return { blobPath: `${relatedTo}/${slug}/${fileName}`, fileName }
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
