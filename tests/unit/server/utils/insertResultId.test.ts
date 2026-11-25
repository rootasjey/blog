import { describe, expect, it } from 'vitest'
import { getSerializableInsertId } from '../../../../server/utils/insertResultId'

describe('getSerializableInsertId', () => {
  it('converts a safe SQLite bigint to a JSON-safe number', () => {
    expect(getSerializableInsertId({ lastInsertRowid: 9n })).toBe(9)
  })

  it('preserves a bigint as text when converting it to a number would lose precision', () => {
    expect(getSerializableInsertId({ lastInsertRowid: 9007199254740993n })).toBe('9007199254740993')
  })

  it('uses the D1 metadata ID when the local SQLite result is absent', () => {
    expect(getSerializableInsertId({ meta: { last_row_id: 12 } })).toBe(12)
  })

  it('returns null when the insert result has no ID', () => {
    expect(getSerializableInsertId(null)).toBeNull()
  })
})
