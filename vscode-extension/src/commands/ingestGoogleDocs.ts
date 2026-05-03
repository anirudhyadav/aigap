import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { getAigapDir, ensureAigapDir } from '../workspace/detector'
import { writePolicies } from '../workspace/writer'

export async function commandIngestGoogleDocs(): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    prompt: 'Google API key or OAuth access token',
    password: true,
    ignoreFocusOut: true
  })
  if (!apiKey?.trim()) return

  const docId = await vscode.window.showInputBox({
    prompt: 'Google Doc ID (from the URL)',
    placeHolder: 'e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
    ignoreFocusOut: true
  })
  if (!docId?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Ingesting from Google Docs...', cancellable: false },
    async () => {
      const url = `https://docs.googleapis.com/v1/documents/${docId}`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })

      if (!response.ok) {
        vscode.window.showErrorMessage(`aigap: Google Docs API error ${response.status}`)
        return
      }

      const doc = await response.json() as GoogleDoc
      const textContent = extractGoogleDocText(doc)
      const docTitle = doc.title ?? 'Untitled'

      const SYSTEM = `You are an AI governance engineer. Convert the following Google Doc content into
a structured POLICIES.md format. Extract guardrail categories, policies, and enforcement vectors.
Assign stable IDs (GP-NNN, GC-NNN, EV-NNN). Format as the aigap POLICIES.md format.`

      const llmResponse = await callLLM(
        `Google Doc "${docTitle}":\n\n${textContent.slice(0, 8000)}`,
        SYSTEM
      )

      const aigapDir = getAigapDir()
      ensureAigapDir(aigapDir)
      writePolicies(aigapDir, llmResponse.text)

      vscode.window.showInformationMessage(`aigap: Ingested "${docTitle}" from Google Docs. Review .aigap/POLICIES.md`)
    }
  )
}

interface GoogleDoc {
  title?: string
  body?: {
    content?: DocElement[]
  }
}

interface DocElement {
  paragraph?: {
    elements?: { textRun?: { content?: string } }[]
    paragraphStyle?: { namedStyleType?: string }
  }
}

function extractGoogleDocText(doc: GoogleDoc): string {
  const lines: string[] = []
  for (const element of doc.body?.content ?? []) {
    if (element.paragraph) {
      const text = element.paragraph.elements
        ?.map(e => e.textRun?.content ?? '')
        .join('') ?? ''
      const style = element.paragraph.paragraphStyle?.namedStyleType ?? ''
      if (style === 'HEADING_1') lines.push(`# ${text.trim()}`)
      else if (style === 'HEADING_2') lines.push(`## ${text.trim()}`)
      else if (style === 'HEADING_3') lines.push(`### ${text.trim()}`)
      else if (text.trim()) lines.push(text.trim())
    }
  }
  return lines.join('\n\n')
}
