import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeEnforcement } from '../workspace/writer'

const SYSTEM = `You are a senior engineer generating enforcement stubs for an AI guardrail system.
For each policy marked as gap in the POLICIES.md, generate a Python enforcement stub.
Include imports, docstring referencing the policy ID, and core logic.
Format as markdown.`

export async function commandEnforcement(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Generating enforcement stubs...', cancellable: true },
    async (_, token) => {
      const response = await callLLM(content.slice(0, 6000), SYSTEM, token)
      writeEnforcement(aigapDir, response.text)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Enforcement stubs generated. Saved to .aigap/enforcement/')
    }
  )
}
