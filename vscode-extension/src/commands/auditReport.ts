import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeAuditReport } from '../workspace/writer'

const SYSTEM = `You are a compliance auditor. Given POLICIES.md, generate an audit report
mapping each policy to its enforcement evidence. Include: executive summary, policy audit detail,
violations summary, recommendations, sign-off section. Format as markdown.`

export async function commandAuditReport(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Generating audit report...', cancellable: true },
    async (_, token) => {
      const response = await callLLM(content.slice(0, 6000), SYSTEM, token)
      writeAuditReport(aigapDir, response.text)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Audit report saved to .aigap/audit-report.md')
    }
  )
}
