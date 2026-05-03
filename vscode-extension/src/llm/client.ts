import * as vscode from 'vscode'

export interface LLMResponse {
  text: string
}

export async function callLLM(
  prompt: string,
  systemPrompt: string,
  token?: vscode.CancellationToken
): Promise<LLMResponse> {
  const [model] = await vscode.lm.selectChatModels({ family: getPreferredModel() })
  if (!model) {
    throw new Error('aigap: No Copilot model available. Ensure GitHub Copilot is active.')
  }

  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(prompt)
  ]

  const cts = token ? undefined : new vscode.CancellationTokenSource()
  const effectiveToken = token ?? cts!.token
  try {
    const response = await model.sendRequest(messages, {}, effectiveToken)

    let text = ''
    for await (const chunk of response.text) {
      text += chunk
    }
    return { text }
  } finally {
    cts?.dispose()
  }
}

export async function callLLMJson<T>(
  prompt: string,
  systemPrompt: string,
  token?: vscode.CancellationToken
): Promise<T> {
  const response = await callLLM(prompt, systemPrompt, token)
  const jsonMatch = response.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('aigap: LLM did not return valid JSON array')
  }
  return JSON.parse(jsonMatch[0]) as T
}

function getPreferredModel(): string {
  return vscode.workspace.getConfiguration('aigap').get<string>('preferredModel', 'claude-sonnet-4-6')
}
