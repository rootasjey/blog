import { mkdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { buildTablerIconShards, TABLER_ICON_SHARD_SIZE, type TablerIconDefinition } from '../shared/utils/tabler-icon-catalog'

const require = createRequire(import.meta.url)
const collection = require('@iconify-json/tabler/icons.json') as {
  icons: Record<string, TablerIconDefinition>
}
const outputDirectory = resolve(import.meta.dir, '../public/tabler-icons')
const shardsDirectory = resolve(outputDirectory, 'shards')
const { names, shards } = buildTablerIconShards(collection.icons)

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(shardsDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'manifest.json'), JSON.stringify({
  version: 1,
  count: names.length,
  shardSize: TABLER_ICON_SHARD_SIZE,
  names,
}), 'utf8')

await Promise.all(Object.entries(shards).map(([shardId, icons]) =>
  writeFile(resolve(shardsDirectory, `${shardId}.json`), JSON.stringify({ icons }), 'utf8'),
))

console.log(`Generated a Tabler icon index and ${Object.keys(shards).length} SVG shards for ${names.length} icons.`)
