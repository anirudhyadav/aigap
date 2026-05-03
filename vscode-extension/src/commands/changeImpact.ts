import * as vscode from 'vscode'
import * as path from 'path'
import { parsePdf } from '../core/parsers/pdf'
import { parseDocx } from '../core/parsers/docx'
import { parseMarkdown } from '../core/parsers/markdown'
import { analyzeChangeImpact } from '../core/analyzers/change_impact'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeChangeImpact } from '../workspace/writer'

export async function commandChangeImpact(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: currentPolicies } = loadPoliciesContext(aigapDir)

  if (!currentPolicies.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'New Policy Version': ['pdf', 'docx', 'doc', 'md'] },
    title: 'Select new policy document version to compare'
  })
  if (!uris || uris.length === 0) return

  const filePath = uris[0].fsPath
  const ext = path.extname(filePath).toLowerCase()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Analysing change impact...', cancellable: true },
    async (_, token) => {
      const rawDoc =
        ext === '.pdf' ? await parsePdf(filePath) :
        ext === '.md'  ? parseMarkdown(filePath) :
        await parseDocx(filePath)

      const report = await analyzeChangeImpact(currentPolicies, rawDoc.text, token)
      writeChangeImpact(aigapDir, report)

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Change impact report saved to .aigap/change-impact-report.md')
    }
  )
}
