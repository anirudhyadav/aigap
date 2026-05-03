import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { getAigapDir, ensureAigapDir } from '../workspace/detector'
import { writePolicies } from '../workspace/writer'
import { readRegistry, writeRegistry, nextId } from '../core/registry'

export async function commandIngestConfluence(): Promise<void> {
  const config = vscode.workspace.getConfiguration('aigap')
  let baseUrl = config.get<string>('confluenceBaseUrl', '')

  if (!baseUrl) {
    baseUrl = await vscode.window.showInputBox({
      prompt: 'Confluence base URL',
      placeHolder: 'https://yourorg.atlassian.net',
      ignoreFocusOut: true
    }) ?? ''
    if (!baseUrl) return
  }

  const pageId = await vscode.window.showInputBox({
    prompt: 'Confluence page ID',
    placeHolder: 'e.g. 12345678',
    ignoreFocusOut: true
  })
  if (!pageId?.trim()) return

  const token = await vscode.window.showInputBox({
    prompt: 'Confluence API token (or Personal Access Token)',
    password: true,
    ignoreFocusOut: true
  })
  if (!token?.trim()) return

  const email = await vscode.window.showInputBox({
    prompt: 'Confluence email (for basic auth)',
    placeHolder: 'you@company.com',
    ignoreFocusOut: true
  })
  if (!email?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Ingesting from Confluence...', cancellable: false },
    async () => {
      const authHeader = Buffer.from(`${email}:${token}`).toString('base64')
      const url = `${baseUrl}/wiki/api/v2/pages/${pageId}?body-format=storage`

      const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${authHeader}`, 'Accept': 'application/json' }
      })

      if (!response.ok) {
        vscode.window.showErrorMessage(`aigap: Confluence API error ${response.status}`)
        return
      }

      const data = await response.json() as { body?: { storage?: { value?: string } }; title?: string }
      const htmlContent = data.body?.storage?.value ?? ''
      const pageTitle = data.title ?? 'Untitled'

      const SYSTEM = `You are an AI governance engineer. Convert the following Confluence page HTML into
a structured POLICIES.md format. Extract guardrail categories, policies, and enforcement vectors.
Assign stable IDs (GP-NNN, GC-NNN, EV-NNN). Format as the aigap POLICIES.md format.`

      const llmResponse = await callLLM(
        `Confluence page "${pageTitle}":\n\n${htmlContent.slice(0, 8000)}`,
        SYSTEM
      )

      const aigapDir = getAigapDir()
      ensureAigapDir(aigapDir)
      writePolicies(aigapDir, llmResponse.text)

      vscode.window.showInformationMessage(`aigap: Ingested "${pageTitle}" from Confluence. Review .aigap/POLICIES.md`)
    }
  )
}
