import * as vscode from 'vscode'
import { analyzeStaleness, formatStalenessReport } from '../core/analyzers/staleness'
import { getAigapDir } from '../workspace/detector'
import { writeStalenessReport } from '../workspace/writer'

export async function commandStaleness(): Promise<void> {
  const aigapDir = getAigapDir()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Checking policy staleness...', cancellable: false },
    async () => {
      const entries = analyzeStaleness(aigapDir)

      if (entries.length === 0) {
        vscode.window.showWarningMessage('aigap: No policies found. Run aigap: Initialize first.')
        return
      }

      const report = formatStalenessReport(entries)
      writeStalenessReport(aigapDir, report)

      const staleCount = entries.filter(e => e.daysSince !== null && e.daysSince > 90).length

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage(
        `aigap: Staleness check complete — ${staleCount} stale policy(s). Saved to .aigap/staleness-report.md`
      )
    }
  )
}
