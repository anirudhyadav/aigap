import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { buildFrameworkMapPrompt } from '../llm/context_builder'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeFrameworkMap } from '../workspace/writer'

const SYSTEM = `You are a compliance specialist. Map each guardrail policy to relevant clauses in:
EU AI Act (2024/1689), NIST AI RMF 1.0, ISO/IEC 42001, SOC 2 Trust Services Criteria.
Include: coverage summary, mapping table, framework detail sections, and gaps.
Format as markdown.`

export async function commandFrameworkMap(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Mapping compliance frameworks...', cancellable: true },
    async (_, token) => {
      const prompt = buildFrameworkMapPrompt(content)
      const response = await callLLM(prompt, SYSTEM, token)
      writeFrameworkMap(aigapDir, response.text)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Framework map saved to .aigap/framework-map.md')
    }
  )
}
