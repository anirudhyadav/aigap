import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeStatusReport, sanitizeFilename } from '../workspace/writer'

const SYSTEM = `You are writing a compliance status report for non-technical leadership.
Use plain English. No code, no jargon. Explain everything in terms of risk, progress, and next steps.
Include: executive summary, scorecard, what's working, what needs attention, key metrics, next steps, sign-off.
Format as markdown.`

export async function commandStatusReport(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const version = await vscode.window.showInputBox({
    prompt: 'Version or sprint identifier',
    placeHolder: 'e.g. v1.2 / Sprint 14',
    ignoreFocusOut: true
  })
  if (!version?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Generating status report...', cancellable: true },
    async (_, token) => {
      const response = await callLLM(
        `Generate a status report for ${version}:\n\n${content.slice(0, 6000)}`,
        SYSTEM,
        token
      )

      writeStatusReport(aigapDir, version, response.text)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage(`aigap: Status report saved to .aigap/releases/status-${sanitizeFilename(version)}.md`)
    }
  )
}
