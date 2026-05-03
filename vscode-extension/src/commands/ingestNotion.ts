import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { getAigapDir, ensureAigapDir } from '../workspace/detector'
import { writePolicies } from '../workspace/writer'

export async function commandIngestNotion(): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    prompt: 'Notion Integration Token (Internal Integration)',
    password: true,
    ignoreFocusOut: true
  })
  if (!apiKey?.trim()) return

  const pageId = await vscode.window.showInputBox({
    prompt: 'Notion page ID (32-char hex from URL)',
    placeHolder: 'e.g. a1b2c3d4e5f6...',
    ignoreFocusOut: true
  })
  if (!pageId?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Ingesting from Notion...', cancellable: false },
    async () => {
      const blocksUrl = `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`
      const response = await fetch(blocksUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        vscode.window.showErrorMessage(`aigap: Notion API error ${response.status}`)
        return
      }

      const data = await response.json() as { results: NotionBlock[] }
      const textContent = extractNotionText(data.results)

      const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28'
        }
      })
      const pageData = await pageResponse.json() as { properties?: { title?: { title?: { plain_text?: string }[] } } }
      const pageTitle = pageData.properties?.title?.title?.[0]?.plain_text ?? 'Untitled'

      const SYSTEM = `You are an AI governance engineer. Convert the following Notion page content into
a structured POLICIES.md format. Extract guardrail categories, policies, and enforcement vectors.
Assign stable IDs (GP-NNN, GC-NNN, EV-NNN). Format as the aigap POLICIES.md format.`

      const llmResponse = await callLLM(
        `Notion page "${pageTitle}":\n\n${textContent.slice(0, 8000)}`,
        SYSTEM
      )

      const aigapDir = getAigapDir()
      ensureAigapDir(aigapDir)
      writePolicies(aigapDir, llmResponse.text)

      vscode.window.showInformationMessage(`aigap: Ingested "${pageTitle}" from Notion. Review .aigap/POLICIES.md`)
    }
  )
}

interface NotionBlock {
  type: string
  [key: string]: unknown
}

interface RichText {
  plain_text: string
}

function extractNotionText(blocks: NotionBlock[]): string {
  const lines: string[] = []
  for (const block of blocks) {
    const content = block[block.type] as { rich_text?: RichText[] } | undefined
    if (content?.rich_text) {
      const text = content.rich_text.map((t: RichText) => t.plain_text).join('')
      if (block.type.startsWith('heading')) {
        const level = block.type === 'heading_1' ? '#' : block.type === 'heading_2' ? '##' : '###'
        lines.push(`${level} ${text}`)
      } else {
        lines.push(text)
      }
    }
  }
  return lines.join('\n\n')
}
