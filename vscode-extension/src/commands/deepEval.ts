import * as vscode from 'vscode'
import { runThreeStagePipeline } from '../llm/pipeline'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'

export async function commandDeepEval(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: policiesContent } = loadPoliciesContext(aigapDir)

  if (!policiesContent.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const inputText = await vscode.window.showInputBox({
    prompt: 'Paste sample LLM input/output to evaluate against policies',
    placeHolder: 'e.g. a prompt + response pair to test',
    ignoreFocusOut: true
  })
  if (!inputText?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Running three-stage evaluation...', cancellable: true },
    async (progress, token) => {
      const result = await runThreeStagePipeline(
        policiesContent,
        inputText,
        token,
        (stage) => progress.report({ message: stage })
      )

      const report = [
        '# Deep Evaluation Report',
        `_Generated: ${new Date().toISOString().split('T')[0]}_`,
        '',
        '## Executive Summary',
        result.synthesis,
        '',
        '---',
        '',
        '## Detailed Analysis',
        result.analysis,
        '',
        '---',
        '',
        '## Classification Results',
        '```json',
        result.classification,
        '```'
      ].join('\n')

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Three-stage evaluation complete.')
    }
  )
}
