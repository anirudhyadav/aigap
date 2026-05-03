import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'

const SYSTEM = `You are a governance auditor. Validate the POLICIES.md structure.
Check for: duplicate IDs, ID gaps, missing required fields, invalid severity, invalid status,
orphan vectors, missing vectors, vague descriptions, empty categories, cross-reference integrity.
Return a markdown validation report with Errors (must fix) and Warnings (should fix) tables.`

export async function commandValidate(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Validating policies...', cancellable: true },
    async (_, token) => {
      const response = await callLLM(content.slice(0, 8000), SYSTEM, token)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Validation complete.')
    }
  )
}
