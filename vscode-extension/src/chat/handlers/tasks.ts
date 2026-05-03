import * as vscode from 'vscode'
import { callLLM } from '../../llm/client'
import { loadPoliciesContext } from '../../workspace/reader'
import { getAigapDir } from '../../workspace/detector'

const SYSTEM = `You are a scrum master. Given the POLICIES.md, list enforcement tasks for all policies
marked as gap or partial. For each task, provide: policy ID, priority, description, story points.
Format as a markdown table.`

export async function handleTasks(
  _request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    stream.markdown('No `.aigap/` context found. Run **aigap: Initialize from Policy Doc** first.')
    return
  }

  stream.markdown('Generating enforcement tasks...\n\n')
  const response = await callLLM(content.slice(0, 6000), SYSTEM, token)
  stream.markdown(response.text)
}
