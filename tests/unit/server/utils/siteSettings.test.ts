import { describe, expect, it, vi, beforeEach } from 'vitest'

const { dbMock } = vi.hoisted(() => {
  const findFirst = vi.fn()
  const run = vi.fn().mockResolvedValue({})
  const values = vi.fn().mockReturnValue({ run })
  const insert = vi.fn().mockReturnValue({ values })
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ run }),
    }),
  })

  return {
    dbMock: {
      query: {
        site_settings: {
          findFirst,
        },
      },
      insert,
      update,
    },
  }
})

vi.mock('hub:db', () => {
  const schema = { site_settings: {} }
  return { db: dbMock, schema }
})

import { aboutPageContentSchema, getSettingValue, homeIdentitySchema, setSettingValue } from '../../../../server/utils/siteSettings'
import { DEFAULT_ABOUT_PAGE_CONTENT } from '../../../../shared/types/public-page-content'
import { DEFAULT_HOME_IDENTITY } from '../../../../shared/types/home-identity'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSettingValue', () => {
  it('returns fallback when no setting exists', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue(null)

    const result = await getSettingValue('socials', [])
    expect(result).toEqual([])
  })

  it('parses existing setting value', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue({
      value: JSON.stringify([{ platform: 'github', url: 'https://github.com/test' }]),
    })

    const result = await getSettingValue('socials', [])
    expect(result).toEqual([{ platform: 'github', url: 'https://github.com/test' }])
  })

  it('returns fallback on invalid JSON', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue({ value: 'invalid json' })

    const result = await getSettingValue('socials', [])
    expect(result).toEqual([])
  })
})

describe('setSettingValue', () => {
  it('inserts new setting when key does not exist', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue(null)

    await setSettingValue('socials', [{ platform: 'github', url: 'https://github.com/test' }])

    expect(dbMock.insert).toHaveBeenCalled()
  })

  it('updates existing setting when key exists', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue({ id: 1 })

    await setSettingValue('socials', [{ platform: 'github', url: 'https://github.com/test' }])

    expect(dbMock.update).toHaveBeenCalled()
    expect(dbMock.insert).not.toHaveBeenCalled()
  })
})

describe('static rich text settings', () => {
  it('keeps accepting existing plain text settings', () => {
    expect(homeIdentitySchema.safeParse(DEFAULT_HOME_IDENTITY).success).toBe(true)
    expect(aboutPageContentSchema.safeParse(DEFAULT_ABOUT_PAGE_CONTENT).success).toBe(true)
  })

  it('accepts formatted text documents and rejects unsafe links', () => {
    const content = structuredClone(DEFAULT_HOME_IDENTITY)
    content.fr.description = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Un texte', marks: [{ type: 'bold' }] }] }],
    }
    expect(homeIdentitySchema.safeParse(content).success).toBe(true)

    content.fr.description = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'lien', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }],
    }
    expect(homeIdentitySchema.safeParse(content).success).toBe(false)
  })
})
