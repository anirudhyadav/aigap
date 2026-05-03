import * as fs from 'fs'
import * as path from 'path'
import { Registry, RegistryCounters } from './models/registry'

const REGISTRY_FILE = 'registry.json'

const EMPTY_REGISTRY: Registry = {
  counters: { GP: 0, GC: 0, EV: 0, FR: 0, TASK: 0 },
  lastUpdated: new Date().toISOString().split('T')[0]
}

export function readRegistry(aigapDir: string): Registry {
  const filePath = path.join(aigapDir, REGISTRY_FILE)
  if (!fs.existsSync(filePath)) {
    return structuredClone(EMPTY_REGISTRY)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Registry
}

export function writeRegistry(aigapDir: string, registry: Registry): void {
  const filePath = path.join(aigapDir, REGISTRY_FILE)
  registry.lastUpdated = new Date().toISOString().split('T')[0]
  fs.writeFileSync(filePath, JSON.stringify(registry, null, 2), 'utf-8')
}

export function nextId(
  registry: Registry,
  type: keyof RegistryCounters
): { id: string; registry: Registry } {
  const n = registry.counters[type] + 1
  const id = `${type}-${String(n).padStart(3, '0')}`
  const updated: Registry = {
    ...registry,
    counters: { ...registry.counters, [type]: n }
  }
  return { id, registry: updated }
}
