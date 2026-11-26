import { describe, expect, it } from 'vitest'
import { detectCoverMedia } from '~~/shared/utils/cover-media'

describe('detectCoverMedia', () => {
  it('accepts JPEG covers with a matching file signature', () => {
    expect(detectCoverMedia('image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0]))).toEqual({
      contentType: 'image/jpeg',
      extension: 'jpg',
      kind: 'image',
    })
  })

  it('recognizes APNG from its animation control chunk', () => {
    const bytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 8, 97, 99, 84, 76,
      0, 0, 0, 1, 0, 0, 0, 2,
      0, 0, 0, 0,
    ])

    expect(detectCoverMedia('image/png', bytes)).toEqual({
      contentType: 'image/png',
      extension: 'apng',
      kind: 'animated-image',
    })
  })

  it('accepts GIF and MP4 videos', () => {
    expect(detectCoverMedia('image/gif', new TextEncoder().encode('GIF89a'))?.kind).toBe('animated-image')

    const mp4 = new Uint8Array(12)
    mp4.set(new TextEncoder().encode('ftyp'), 4)
    expect(detectCoverMedia('video/mp4', mp4)?.extension).toBe('mp4')
  })

  it('rejects unsupported MIME types and mismatched signatures', () => {
    expect(detectCoverMedia('text/html', new TextEncoder().encode('<html>'))).toBeNull()
    expect(detectCoverMedia('image/jpeg', new TextEncoder().encode('not an image'))).toBeNull()
  })
})
