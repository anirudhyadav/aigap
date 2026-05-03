import * as vscode from 'vscode'
import { analyzeEnforcementLinkage, formatEnforcementLinkage } from '../core/analyzers/enforcement_linkage'
import { getAigapDir } from '../workspace/detector'
import { writeEnforcementLinkage } from '../workspace/writer'

export async function commandEnforcementLink(): Promise<void> {
  const aigapDir = getAigapDir()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Linking policies to enforcement...', cancellable: false },
    async () => {
      const entries = analyzeEnforcementLinkage(aigapDir)

      if (entries.length === 0) {
        vscode.window.showWarningMessage('aigap: No policies found. Run aigap: Initialize first.')
        return
      }

      const report = formatEnforcementLinkage(entries)
      writeEnforcementLinkage(aigapDir, report)

      const linked = entries.filter(e => e.count > 0).length
      const total = entries.length

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage(
        `aigap: Enforcement linkage — ${linked}/${total} policies referenced in code. Saved to .aigap/enforcement-linkage.md`
      )
    }
  )
}
