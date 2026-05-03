import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

interface LinkageEntry {
  policyId: string
  files: string[]
  count: number
}

export function analyzeEnforcementLinkage(aigapDir: string): LinkageEntry[] {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  if (!workspaceRoot) return []

  const policiesPath = path.join(aigapDir, 'POLICIES.md')
  if (!fs.existsSync(policiesPath)) return []

  const content = fs.readFileSync(policiesPath, 'utf-8')
  const ids = [...new Set([...content.matchAll(/\b(GP-\d{3})\b/g)].map(m => m[1]))]

  const entries: LinkageEntry[] = []

  for (const id of ids) {
    const files: string[] = []
    scanDir(workspaceRoot, id, files, workspaceRoot)
    entries.push({ policyId: id, files, count: files.length })
  }

  return entries
}

function scanDir(dir: string, id: string, files: string[], root: string): void {
  const SKIP = ['node_modules', '.git', '.aigap', '__pycache__', '.venv', 'out', 'dist']
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP.includes(entry.name)) {
          scanDir(path.join(dir, entry.name), id, files, root)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (['.py', '.ts', '.js', '.md', '.yaml', '.yml'].includes(ext)) {
          const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8')
          if (content.includes(id)) {
            files.push(path.relative(root, path.join(dir, entry.name)))
          }
        }
      }
    }
  } catch {
    // permission denied or symlink
  }
}

export function formatEnforcementLinkage(entries: LinkageEntry[]): string {
  const total = entries.length
  const linked = entries.filter(e => e.count > 0).length
  const pct = total > 0 ? Math.round((linked / total) * 100) : 0

  const lines = [
    '# Enforcement Linkage Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    '',
    `**Coverage:** ${linked} / ${total} policies referenced in code (${pct}%)`,
    '',
    '| Policy ID | Files | Count |',
    '|---|---|---|'
  ]

  for (const e of entries) {
    const status = e.count === 0 ? '❌ no references' : e.files.join(', ')
    lines.push(`| ${e.policyId} | ${status} | ${e.count} |`)
  }

  return lines.join('\n')
}
