import * as vscode from 'vscode'
import { execFileSync } from 'child_process'
import { callLLM } from '../llm/client'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'

export async function commandPrDraft(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: policiesContent } = loadPoliciesContext(aigapDir)

  if (!policiesContent.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  const range = await vscode.window.showInputBox({
    prompt: 'Git range for PR diff',
    value: 'HEAD~5..HEAD',
    placeHolder: 'e.g. main..HEAD or HEAD~10..HEAD',
    ignoreFocusOut: true
  })
  if (!range?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Drafting PR description...', cancellable: true },
    async (_, token) => {
      let gitDiff = ''
      try {
        gitDiff = execFileSync('git', ['diff', ...range.split(/\s+/), '--stat', '--diff-filter=AM'], {
          cwd: workspaceRoot, maxBuffer: 512 * 1024
        }).toString()

        const commitMessages = execFileSync('git', ['log', ...range.split(/\s+/), '--oneline'], {
          cwd: workspaceRoot
        }).toString()

        gitDiff = `COMMITS:\n${commitMessages}\n\nFILES CHANGED:\n${gitDiff}`
      } catch {
        vscode.window.showWarningMessage('aigap: Could not read git diff.')
        return
      }

      const SYSTEM = `You are a senior engineer writing a pull request description.
Given the guardrail policies context and git changes, generate a professional PR description.
Format as markdown with exactly these sections:
## What Changed
(bullet list of changes, reference policy IDs like GP-001 wherever applicable)
## Policies Covered
(table: | ID | Policy | Status |)
## Enforcement Coverage
(which enforcement stubs cover the changes)
## Notes
(anything the reviewer should know)`

      const prompt = `POLICIES:\n${policiesContent.slice(0, 3000)}\n\nGIT CHANGES:\n${gitDiff.slice(0, 3000)}`
      const response = await callLLM(prompt, SYSTEM, token)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: PR description drafted. Copy it to your PR.')
    }
  )
}
