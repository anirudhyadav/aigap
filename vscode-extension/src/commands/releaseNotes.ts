import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { buildReleaseNotesPrompt } from '../llm/context_builder'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeRelease } from '../workspace/writer'
import { readRegistry, nextId, writeRegistry } from '../core/registry'
import { execFileSync } from 'child_process'

export async function commandReleaseNotes(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: policiesContent } = loadPoliciesContext(aigapDir)

  if (!policiesContent.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const version = await vscode.window.showInputBox({
    prompt: 'Release version',
    placeHolder: 'e.g. v1.2.0',
    ignoreFocusOut: true
  })
  if (!version?.trim()) return

  const branch = await vscode.window.showInputBox({
    prompt: 'Branch or commit range to diff',
    placeHolder: 'e.g. main...release/v1.2 or HEAD~10..HEAD',
    value: 'HEAD~20..HEAD',
    ignoreFocusOut: true
  })
  if (!branch?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Generating release notes...', cancellable: true },
    async (progress, token) => {
      progress.report({ message: 'Reading git diff...' })
      let gitDiff = ''
      try {
        gitDiff = execFileSync('git', ['diff', ...branch.split(/\s+/), '--stat', '--diff-filter=AM'], {
          cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
          maxBuffer: 1024 * 1024
        }).toString()
      } catch {
        vscode.window.showWarningMessage('aigap: Could not read git diff.')
        return
      }

      progress.report({ message: 'Generating release notes...' })
      const SYSTEM = `You are a technical writer. Generate release notes that map code changes to guardrail policy IDs.
Format as markdown with sections: ## Summary, ## What Changed (mapped to GP-XXX IDs), ## Known Gaps.`

      const prompt = buildReleaseNotesPrompt(policiesContent, gitDiff)
      const response = await callLLM(prompt, SYSTEM, token)

      const releaseContent = `# Release Notes — ${version}\n_Generated: ${new Date().toISOString().split('T')[0]}_\n\n${response.text}`
      writeRelease(aigapDir, version, releaseContent)

      const doc = await vscode.workspace.openTextDocument({ content: releaseContent, language: 'markdown' })
      await vscode.window.showTextDocument(doc)

      vscode.window.showInformationMessage(`aigap: Release notes saved to .aigap/releases/${version}.md`)
    }
  )
}
