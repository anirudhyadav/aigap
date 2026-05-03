import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { getAigapDir, ensureAigapDir } from '../workspace/detector'
import { writePolicies } from '../workspace/writer'

export async function commandIngestSharePoint(): Promise<void> {
  const siteUrl = await vscode.window.showInputBox({
    prompt: 'SharePoint site URL',
    placeHolder: 'https://yourorg.sharepoint.com/sites/policies',
    ignoreFocusOut: true
  })
  if (!siteUrl?.trim()) return

  const accessToken = await vscode.window.showInputBox({
    prompt: 'SharePoint / Microsoft Graph access token',
    password: true,
    ignoreFocusOut: true
  })
  if (!accessToken?.trim()) return

  const driveItemPath = await vscode.window.showInputBox({
    prompt: 'Path to document in SharePoint drive',
    placeHolder: 'e.g. /Documents/AI-Policy.docx',
    ignoreFocusOut: true
  })
  if (!driveItemPath?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Ingesting from SharePoint...', cancellable: false },
    async () => {
      const hostname = new URL(siteUrl).hostname
      const sitePath = new URL(siteUrl).pathname
      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}:/drive/root:${driveItemPath}:/content`

      const response = await fetch(graphUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (!response.ok) {
        vscode.window.showErrorMessage(`aigap: SharePoint/Graph API error ${response.status}`)
        return
      }

      const contentType = response.headers.get('content-type') ?? ''
      let textContent: string

      if (contentType.includes('text') || contentType.includes('json')) {
        textContent = await response.text()
      } else {
        const buffer = await response.arrayBuffer()
        textContent = Buffer.from(buffer).toString('utf-8').slice(0, 10000)
      }

      const fileName = driveItemPath.split('/').pop() ?? 'document'

      const SYSTEM = `You are an AI governance engineer. Convert the following SharePoint document content into
a structured POLICIES.md format. Extract guardrail categories, policies, and enforcement vectors.
Assign stable IDs (GP-NNN, GC-NNN, EV-NNN). Format as the aigap POLICIES.md format.`

      const llmResponse = await callLLM(
        `SharePoint document "${fileName}":\n\n${textContent.slice(0, 8000)}`,
        SYSTEM
      )

      const aigapDir = getAigapDir()
      ensureAigapDir(aigapDir)
      writePolicies(aigapDir, llmResponse.text)

      vscode.window.showInformationMessage(`aigap: Ingested "${fileName}" from SharePoint. Review .aigap/POLICIES.md`)
    }
  )
}
