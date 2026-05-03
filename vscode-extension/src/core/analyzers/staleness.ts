import { execSync } from 'child_process'
import * as fs from 'fs'
import * as vscode from 'vscode'

interface StalenessEntry {
  id: string
  lastTouched: string | null
  daysSince: number | null
}

export function analyzeStaleness(aigapDir: string): StalenessEntry[] {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  if (!workspaceRoot) return []

  const entries: StalenessEntry[] = []
  const idPattern = /\b(GP-\d{3})\b/g
  const policiesPath = `${aigapDir}/POLICIES.md`

  try {
    const content = fs.readFileSync(policiesPath, 'utf-8')
    const ids = [...new Set([...content.matchAll(idPattern)].map(m => m[1]))]

    for (const id of ids) {
      try {
        const log = execSync(
          `git log -1 --format=%ci -S "${id}" -- .`,
          { cwd: workspaceRoot, encoding: 'utf-8' }
        ).trim()

        if (log) {
          const lastDate = new Date(log)
          const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          entries.push({ id, lastTouched: log.split(' ')[0], daysSince: days })
        } else {
          entries.push({ id, lastTouched: null, daysSince: null })
        }
      } catch {
        entries.push({ id, lastTouched: null, daysSince: null })
      }
    }
  } catch {
    // POLICIES.md not found
  }

  return entries
}

export function formatStalenessReport(entries: StalenessEntry[]): string {
  const lines = [
    '# Policy Staleness Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    '',
    '| Policy ID | Last Touched | Days Since | Status |',
    '|---|---|---|---|'
  ]

  for (const e of entries) {
    const status = e.daysSince === null ? '❓ never referenced in git' :
                   e.daysSince > 90 ? '🔴 stale (>90 days)' :
                   e.daysSince > 30 ? '🟡 aging (>30 days)' : '🟢 recent'
    lines.push(`| ${e.id} | ${e.lastTouched ?? 'N/A'} | ${e.daysSince ?? 'N/A'} | ${status} |`)
  }

  return lines.join('\n')
}
