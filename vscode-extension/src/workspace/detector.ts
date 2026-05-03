import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

export function getAigapDir(): string {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!workspaceRoot) {
    throw new Error('aigap: No workspace folder open.')
  }
  return path.join(workspaceRoot, '.aigap')
}

export function ensureAigapDir(aigapDir: string): void {
  if (!fs.existsSync(aigapDir)) {
    fs.mkdirSync(aigapDir, { recursive: true })
  }
}
