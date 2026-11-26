export const TABLER_ICON_SHARD_SIZE = 96

export type TablerIconDefinition = { body: string; width?: number; height?: number }
export type TablerIconShard = Record<string, string>

export function buildTablerIconShards(
  icons: Record<string, TablerIconDefinition>,
  shardSize = TABLER_ICON_SHARD_SIZE,
) {
  if (!Number.isInteger(shardSize) || shardSize < 1) {
    throw new Error('Tabler icon shard size must be a positive integer')
  }

  const names = Object.keys(icons).sort()
  const shards: Record<string, TablerIconShard> = {}

  names.forEach((name, index) => {
    const shardId = getTablerIconShardId(index, shardSize)
    shards[shardId] ??= {}
    const icon = icons[name]
    if (icon) shards[shardId][name] = icon.body
  })

  return { names, shards }
}

export function getTablerIconShardId(index: number, shardSize = TABLER_ICON_SHARD_SIZE) {
  return String(Math.floor(index / shardSize)).padStart(3, '0')
}

export function getTablerIconShardIds(
  names: string[],
  indexByName: ReadonlyMap<string, number>,
  shardSize = TABLER_ICON_SHARD_SIZE,
) {
  const shardIds = new Set<string>()

  for (const name of names) {
    const index = indexByName.get(name)
    if (index != null) shardIds.add(getTablerIconShardId(index, shardSize))
  }

  return [...shardIds].sort()
}
