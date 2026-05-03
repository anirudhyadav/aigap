import * as fs from 'fs'
import * as path from 'path'

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function writePolicies(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'POLICIES.md'), content)
}

export function writeRTM(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'index.md'), content)
}

export function writeEnforcement(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'enforcement', 'stubs.md'), content)
}

export function writeGapReport(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'gap-report.md'), content)
}

export function writeRelease(aigapDir: string, version: string, content: string): void {
  const sanitized = sanitizeFilename(version)
  writeFile(path.join(aigapDir, 'releases', `${sanitized}.md`), content)
}

export function writeStatusReport(aigapDir: string, version: string, content: string): void {
  const sanitized = sanitizeFilename(version)
  writeFile(path.join(aigapDir, 'releases', `status-${sanitized}.md`), content)
}

export function writeAuditReport(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'audit-report.md'), content)
}

export function writeSprintFeed(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'sprint-feed.md'), content)
}

export function writeFrameworkMap(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'framework-map.md'), content)
}

export function writeChangeImpact(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'change-impact-report.md'), content)
}

export function writeStalenessReport(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'staleness-report.md'), content)
}

export function writeEnforcementLinkage(aigapDir: string, content: string): void {
  writeFile(path.join(aigapDir, 'enforcement-linkage.md'), content)
}
