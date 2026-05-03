import * as vscode from 'vscode'
import { analyzeGap } from '../core/analyzers/gap'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeGapReport } from '../workspace/writer'

export async function commandGapReport(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: policiesContent } = loadPoliciesContext(aigapDir)

  if (!policiesContent.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const editor = vscode.window.activeTextEditor
  const sourceCode = editor
    ? editor.document.getText()
    : ''

  if (!sourceCode.trim()) {
    vscode.window.showWarningMessage('aigap: Open a file first to check coverage.')
    return
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Analysing gaps...', cancellable: true },
    async (_, token) => {
      const report = await analyzeGap(policiesContent, sourceCode, token)
      writeGapReport(aigapDir, report)

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Gap report saved to .aigap/gap-report.md')
    }
  )
}
