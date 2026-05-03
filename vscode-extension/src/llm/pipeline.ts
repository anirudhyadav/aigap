import * as vscode from 'vscode'

export interface PipelineResult {
  classification: string
  analysis: string
  synthesis: string
}

export interface StageResult {
  text: string
  model: string
  stage: 'classify' | 'analyze' | 'synthesize'
}

const MODEL_TIERS = {
  classify:    ['claude-haiku', 'gpt-4o-mini', 'copilot-gpt-3.5-turbo'],
  analyze:     ['claude-sonnet', 'gpt-4o', 'copilot-gpt-4o'],
  synthesize:  ['claude-opus', 'claude-sonnet', 'gpt-4o', 'copilot-gpt-4']
} as const

async function selectModel(tier: keyof typeof MODEL_TIERS): Promise<vscode.LanguageModelChat | null> {
  const preferences = MODEL_TIERS[tier]
  for (const family of preferences) {
    const models = await vscode.lm.selectChatModels({ family })
    if (models.length > 0) return models[0]
  }
  const fallback = await vscode.lm.selectChatModels()
  return fallback.length > 0 ? fallback[0] : null
}

async function callStage(
  model: vscode.LanguageModelChat,
  systemPrompt: string,
  userPrompt: string,
  token: vscode.CancellationToken
): Promise<string> {
  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userPrompt)
  ]
  const response = await model.sendRequest(messages, {}, token)
  let text = ''
  for await (const chunk of response.text) { text += chunk }
  return text
}

export async function runThreeStagePipeline(
  policyContext: string,
  inputText: string,
  token: vscode.CancellationToken,
  onProgress?: (stage: string) => void
): Promise<PipelineResult> {
  // Stage 1 — Classify (fast model)
  onProgress?.('Stage 1: Classifying with fast model...')
  const classifyModel = await selectModel('classify')
  if (!classifyModel) throw new Error('aigap: No LLM model available for classification.')

  const classifySystem = `You are a policy classifier. Given guardrail policies and input text,
classify each policy as PASS, FAIL, or SKIP. Return a JSON array of objects:
[{"policyId": "GP-XXX", "verdict": "PASS|FAIL|SKIP", "confidence": 0.0-1.0, "reason": "brief"}]
Only flag FAIL when confident. Use SKIP for irrelevant policies.`

  const classification = await callStage(
    classifyModel,
    classifySystem,
    `POLICIES:\n${policyContext.slice(0, 4000)}\n\nINPUT:\n${inputText.slice(0, 4000)}`,
    token
  )

  // Stage 2 — Analyze (medium model, only FAIL verdicts)
  onProgress?.('Stage 2: Deep analysis of flagged policies...')
  const analyzeModel = await selectModel('analyze')
  if (!analyzeModel) throw new Error('aigap: No LLM model available for analysis.')

  const analyzeSystem = `You are a senior policy analyst. Given the classifier results showing FAIL verdicts,
perform deep analysis. For each FAIL: explain exactly what violates, cite the specific policy text,
suggest remediation. Return markdown with one ## section per FAIL policy.`

  const analysis = await callStage(
    analyzeModel,
    analyzeSystem,
    `POLICIES:\n${policyContext.slice(0, 3000)}\n\nCLASSIFIER RESULTS:\n${classification}\n\nINPUT:\n${inputText.slice(0, 2000)}`,
    token
  )

  // Stage 3 — Synthesize (strongest model, executive summary)
  onProgress?.('Stage 3: Synthesizing executive summary...')
  const synthesizeModel = await selectModel('synthesize')
  if (!synthesizeModel) throw new Error('aigap: No LLM model available for synthesis.')

  const synthesizeSystem = `You are a chief compliance officer. Given classification results and deep analysis,
produce an executive summary. Include: overall risk score (1-10), pass rate, critical findings,
recommended actions priority-ordered. Format as markdown.`

  const synthesis = await callStage(
    synthesizeModel,
    synthesizeSystem,
    `CLASSIFICATION:\n${classification}\n\nANALYSIS:\n${analysis}`,
    token
  )

  return { classification, analysis, synthesis }
}
