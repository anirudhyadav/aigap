import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  writeFile, writePolicies, writeRTM, writeEnforcement,
  writeGapReport, writeRelease, writeStatusReport,
  writeAuditReport, writeSprintFeed, writeFrameworkMap,
  writeChangeImpact, writeStalenessReport, writeEnforcementLinkage
} from '../writer'

describe('workspace/writer', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aigap-writer-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('writeFile creates parent directories', () => {
    const filePath = path.join(tmpDir, 'deep', 'nested', 'file.md')
    writeFile(filePath, 'content')
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('content')
  })

  test('writePolicies creates POLICIES.md', () => {
    writePolicies(tmpDir, '# Policies')
    expect(fs.readFileSync(path.join(tmpDir, 'POLICIES.md'), 'utf-8')).toBe('# Policies')
  })

  test('writeRTM creates index.md', () => {
    writeRTM(tmpDir, '# RTM')
    expect(fs.readFileSync(path.join(tmpDir, 'index.md'), 'utf-8')).toBe('# RTM')
  })

  test('writeEnforcement creates enforcement/stubs.md', () => {
    writeEnforcement(tmpDir, '# Stubs')
    expect(fs.readFileSync(path.join(tmpDir, 'enforcement', 'stubs.md'), 'utf-8')).toBe('# Stubs')
  })

  test('writeGapReport creates gap-report.md', () => {
    writeGapReport(tmpDir, '# Gaps')
    expect(fs.existsSync(path.join(tmpDir, 'gap-report.md'))).toBe(true)
  })

  test('writeRelease creates releases/version.md', () => {
    writeRelease(tmpDir, 'v1.0', '# Release')
    expect(fs.existsSync(path.join(tmpDir, 'releases', 'v1.0.md'))).toBe(true)
  })

  test('writeStatusReport creates releases/status-version.md', () => {
    writeStatusReport(tmpDir, 'v1.0', '# Status')
    expect(fs.existsSync(path.join(tmpDir, 'releases', 'status-v1.0.md'))).toBe(true)
  })

  test('writeAuditReport creates audit-report.md', () => {
    writeAuditReport(tmpDir, '# Audit')
    expect(fs.existsSync(path.join(tmpDir, 'audit-report.md'))).toBe(true)
  })

  test('writeSprintFeed creates sprint-feed.md', () => {
    writeSprintFeed(tmpDir, '# Sprint')
    expect(fs.existsSync(path.join(tmpDir, 'sprint-feed.md'))).toBe(true)
  })

  test('writeFrameworkMap creates framework-map.md', () => {
    writeFrameworkMap(tmpDir, '# Map')
    expect(fs.existsSync(path.join(tmpDir, 'framework-map.md'))).toBe(true)
  })

  test('writeChangeImpact creates change-impact-report.md', () => {
    writeChangeImpact(tmpDir, '# Impact')
    expect(fs.existsSync(path.join(tmpDir, 'change-impact-report.md'))).toBe(true)
  })

  test('writeStalenessReport creates staleness-report.md', () => {
    writeStalenessReport(tmpDir, '# Stale')
    expect(fs.existsSync(path.join(tmpDir, 'staleness-report.md'))).toBe(true)
  })

  test('writeEnforcementLinkage creates enforcement-linkage.md', () => {
    writeEnforcementLinkage(tmpDir, '# Linkage')
    expect(fs.existsSync(path.join(tmpDir, 'enforcement-linkage.md'))).toBe(true)
  })
})
