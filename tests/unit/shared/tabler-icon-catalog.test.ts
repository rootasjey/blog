import { describe, expect, it } from 'vitest'
import {
  buildTablerIconShards,
  getTablerIconShardIds,
} from '~~/shared/utils/tabler-icon-catalog'

describe('Tabler icon catalog', () => {
  it('builds sorted shards containing only SVG bodies', () => {
    const catalog = buildTablerIconShards({
      zebra: { body: '<path id="z" />', width: 24 },
      arrow: { body: '<path id="a" />', width: 24 },
      book: { body: '<path id="b" />', height: 24 },
    }, 2)

    expect(catalog.names).toEqual(['arrow', 'book', 'zebra'])
    expect(catalog.shards).toEqual({
      '000': { arrow: '<path id="a" />', book: '<path id="b" />' },
      '001': { zebra: '<path id="z" />' },
    })
  })

  it('returns unique shards for visible names and skips unknown names', () => {
    const indexByName = new Map([['one', 0], ['two', 1], ['three', 2], ['four', 3]])

    expect(getTablerIconShardIds(['one', 'two', 'three', 'one', 'missing'], indexByName, 2))
      .toEqual(['000', '001'])
  })

  it('rejects invalid shard sizes', () => {
    expect(() => buildTablerIconShards({}, 0)).toThrow('positive integer')
  })
})
