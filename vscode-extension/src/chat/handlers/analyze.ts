import * as vscode from 'vscode'
import { callLLM } from '../../llm/client'
import { buildQueryPrompt } from '../../llm/context_builder'
import { loadPoliciesContext } from '../../workspace/reader'
import { getAigapDir } from '../../workspace/detector'

export async function handleAnalyze(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    stream.markdown('No `.aigap/` context found. Run **aigap: Initialize from Policy Doc** first.')
    return
  }

  const SYSTEM = `You are a governance analyst. Answer questions about guardrail policies using the provided POLICIES.md.
Reference policy IDs (GP-XXX, GC-XXX, EV-XXX) in your answers. Be concise and precise.`

  const prompt = buildQueryPrompt(request.prompt, content)

  stream.markdown('Analyzing policies...\n\n')
  const response = await callLLM(prompt, SYSTEM, token)
  stream.markdown(response.text)
}
