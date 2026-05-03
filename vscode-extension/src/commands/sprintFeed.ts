import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { buildSprintFeedPrompt } from '../llm/context_builder'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writeSprintFeed } from '../workspace/writer'

const SYSTEM = `You are a scrum master. Given POLICIES.md, generate sprint-ready task cards
for every policy with status gap or partial. Each task must include: TASK-NNN ID, policy reference,
priority, story points, description, acceptance criteria, definition of done.
Format as markdown.`

export async function commandSprintFeed(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Generating sprint feed...', cancellable: true },
    async (_, token) => {
      const prompt = buildSprintFeedPrompt(content)
      const response = await callLLM(prompt, SYSTEM, token)
      writeSprintFeed(aigapDir, response.text)

      const doc = await vscode.workspace.openTextDocument({ content: response.text, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aigap: Sprint feed saved to .aigap/sprint-feed.md')
    }
  )
}
