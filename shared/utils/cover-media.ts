export const MAX_COVER_FILE_BYTES = 25 * 1024 * 1024
export const MAX_COVER_VIDEO_DURATION_SECONDS = 30

export type CoverMediaKind = 'image' | 'animated-image' | 'video'

export interface CoverMediaInfo {
  contentType: string
  extension: string
  kind: CoverMediaKind
}

const COVER_TYPES: Record<string, Omit<CoverMediaInfo, 'contentType'>> = {
  'image/jpeg': { extension: 'jpg', kind: 'image' },
  'image/png': { extension: 'png', kind: 'image' },
  'image/apng': { extension: 'apng', kind: 'animated-image' },
  'image/gif': { extension: 'gif', kind: 'animated-image' },
  'image/bmp': { extension: 'bmp', kind: 'image' },
  'image/x-ms-bmp': { extension: 'bmp', kind: 'image' },
  'image/tiff': { extension: 'tiff', kind: 'image' },
  'image/webp': { extension: 'webp', kind: 'image' },
  'image/avif': { extension: 'avif', kind: 'image' },
  'video/mp4': { extension: 'mp4', kind: 'video' },
  'video/webm': { extension: 'webm', kind: 'video' },
}

export function detectCoverMedia(
  contentType: string,
  bytes: Uint8Array,
  filename = '',
): CoverMediaInfo | null {
  const normalizedType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
  const supported = COVER_TYPES[normalizedType]
  if (!supported) return null

  if (normalizedType === 'image/png' && (filename.toLowerCase().endsWith('.apng') || isApng(bytes))) {
    return { contentType: normalizedType, extension: 'apng', kind: 'animated-image' }
  }

  if (!matchesSignature(normalizedType, bytes)) return null

  return { contentType: normalizedType, ...supported }
}

function matchesSignature(type: string, bytes: Uint8Array): boolean {
  switch (type) {
    case 'image/jpeg': return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case 'image/png':
    case 'image/apng': return hasBytes(bytes, [137, 80, 78, 71, 13, 10, 26, 10])
    case 'image/gif': return hasAscii(bytes, 'GIF87a') || hasAscii(bytes, 'GIF89a')
    case 'image/bmp':
    case 'image/x-ms-bmp': return hasAscii(bytes, 'BM')
    case 'image/tiff': return hasBytes(bytes, [0x49, 0x49, 0x2a, 0]) || hasBytes(bytes, [0x4d, 0x4d, 0, 0x2a])
    case 'image/webp': return hasAsciiAt(bytes, 0, 'RIFF') && hasAsciiAt(bytes, 8, 'WEBP')
    case 'image/avif': return hasAsciiAt(bytes, 4, 'ftyp') && hasAsciiAt(bytes, 8, 'avif')
    case 'video/mp4': return hasAsciiAt(bytes, 4, 'ftyp')
    case 'video/webm': return hasBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3])
    default: return false
  }
}

function isApng(bytes: Uint8Array): boolean {
  if (!hasBytes(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) return false

  let offset = 8
  while (offset + 12 <= bytes.length) {
    const byte0 = bytes[offset] ?? 0
    const byte1 = bytes[offset + 1] ?? 0
    const byte2 = bytes[offset + 2] ?? 0
    const byte3 = bytes[offset + 3] ?? 0
    const chunkLength = (byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3
    if (chunkLength < 0 || offset + 12 + chunkLength > bytes.length) return false
    if (hasAsciiAt(bytes, offset + 4, 'acTL')) return true
    if (hasAsciiAt(bytes, offset + 4, 'IEND')) return false
    offset += 12 + chunkLength
  }

  return false
}

function hasBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte)
}

function hasAscii(bytes: Uint8Array, value: string): boolean {
  return hasAsciiAt(bytes, 0, value)
}

function hasAsciiAt(bytes: Uint8Array, offset: number, value: string): boolean {
  return [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0))
}
