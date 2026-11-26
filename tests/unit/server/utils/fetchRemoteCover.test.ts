import { describe, expect, it, vi } from 'vitest'
import { fetchRemoteCover, validateRemoteCoverUrl } from '../../../../server/utils/fetchRemoteCover'

const gif = new TextEncoder().encode('GIF89a')

describe('validateRemoteCoverUrl', () => {
  it.each([
    'http://example.com/cover.gif',
    'https://localhost/cover.gif',
    'https://127.0.0.1/cover.gif',
    'https://[::1]/cover.gif',
    'https://user@example.com/cover.gif',
    'https://example.com:8443/cover.gif',
  ])('rejects unsafe URL %s', (url) => {
    expect(() => validateRemoteCoverUrl(url)).toThrow()
  })

  it('accepts public HTTPS URLs', () => {
    expect(validateRemoteCoverUrl('https://images.example.com/cover.gif')).toBe('https://images.example.com/cover.gif')
  })
})

describe('fetchRemoteCover', () => {
  it('downloads a supported image and follows a public HTTPS redirect', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://cdn.example.com/cover.gif' } }))
      .mockResolvedValueOnce(new Response(gif, { status: 200, headers: { 'content-type': 'image/gif' } }))

    await expect(fetchRemoteCover('https://images.example.com/cover.gif', fetcher)).resolves.toMatchObject({
      contentType: 'image/gif',
      fileName: 'cover.gif',
      media: { extension: 'gif', kind: 'animated-image' },
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('revalidates redirect destinations before requesting them', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private.gif' } }),
    )

    await expect(fetchRemoteCover('https://images.example.com/cover.gif', fetcher)).rejects.toThrow('Only public HTTPS')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('rejects content that is not an image', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('not an image', {
      headers: { 'content-type': 'text/html' },
    }))

    await expect(fetchRemoteCover('https://images.example.com/cover.gif', fetcher)).rejects.toThrow('supported image')
  })
})
