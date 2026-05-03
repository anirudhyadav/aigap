import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { readRegistry, writeRegistry, nextId } from '../registry'

describe('registry', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aigap-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('readRegistry returns empty registry when file does not exist', () => {
    const registry = readRegistry(tmpDir)
    expect(registry.counters.GP).toBe(0)
    expect(registry.counters.GC).toBe(0)
    expect(registry.counters.EV).toBe(0)
    expect(registry.counters.FR).toBe(0)
    expect(registry.counters.TASK).toBe(0)
  })

  test('writeRegistry and readRegistry round-trip', () => {
    const registry = readRegistry(tmpDir)
    registry.counters.GP = 5
    registry.counters.GC = 3
    writeRegistry(tmpDir, registry)

    const loaded = readRegistry(tmpDir)
    expect(loaded.counters.GP).toBe(5)
    expect(loaded.counters.GC).toBe(3)
    expect(loaded.lastUpdated).toBeTruthy()
  })

  test('nextId increments counter and formats ID correctly', () => {
    const registry = readRegistry(tmpDir)
    const { id: id1, registry: r1 } = nextId(registry, 'GP')
    expect(id1).toBe('GP-001')
    expect(r1.counters.GP).toBe(1)

    const { id: id2, registry: r2 } = nextId(r1, 'GP')
    expect(id2).toBe('GP-002')
    expect(r2.counters.GP).toBe(2)
  })

  test('nextId works for all counter types', () => {
    let reg = readRegistry(tmpDir)

    const types = ['GP', 'GC', 'EV', 'FR', 'TASK'] as const
    for (const type of types) {
      const { id, registry: updated } = nextId(reg, type)
      expect(id).toBe(`${type}-001`)
      reg = updated
    }
  })

  test('IDs are never reused after write/read cycle', () => {
    let reg = readRegistry(tmpDir)
    for (let i = 0; i < 5; i++) {
      const { registry: updated } = nextId(reg, 'GP')
      reg = updated
    }
    writeRegistry(tmpDir, reg)

    const loaded = readRegistry(tmpDir)
    const { id } = nextId(loaded, 'GP')
    expect(id).toBe('GP-006')
  })
})
