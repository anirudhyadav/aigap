import * as vscode from 'vscode'
import { analyzeGap } from '../../core/analyzers/gap'
import { loadPoliciesContext } from '../../workspace/reader'
import { getAigapDir } from '../../workspace/detector'

export async function handleCoverage(
  _request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: policiesContent } = loadPoliciesContext(aigapDir)

  if (!policiesContent.trim()) {
    stream.markdown('No `.aigap/` context found. Run **aigap: Initialize from Policy Doc** first.')
    return
  }

  const editor = vscode.window.activeTextEditor
  if (!editor) {
    stream.markdown('No file open. Open a file first and try again.')
    return
  }

  const sourceCode = editor.document.getText()
  const fileName = editor.document.fileName

  stream.markdown(`Checking coverage for \`${fileName}\`...\n\n`)
  const report = await analyzeGap(policiesContent, sourceCode, token)
  stream.markdown(report)
}
