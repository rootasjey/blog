type InsertResultLike = {
  lastInsertRowid?: number | bigint | null
  meta?: { last_row_id?: number | bigint | null } | null
} | null | undefined

export function getSerializableInsertId(result: InsertResultLike): number | string | null {
  const id = result?.lastInsertRowid ?? result?.meta?.last_row_id
  if (id == null) return null

  if (typeof id === 'bigint') {
    const numericId = Number(id)
    return Number.isSafeInteger(numericId) ? numericId : id.toString()
  }

  return id
}
