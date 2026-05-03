import * as fs from 'fs'
import * as path from 'path'

export function loadPoliciesContext(aigapDir: string): { content: string } {
  const policiesPath = path.join(aigapDir, 'POLICIES.md')
  if (!fs.existsSync(policiesPath)) {
    return { content: '' }
  }
  return { content: fs.readFileSync(policiesPath, 'utf-8') }
}

export function loadFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}
