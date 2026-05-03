import { callLLMJson } from '../../llm/client'
import { GuardrailPolicy } from '../models/policy'
import * as vscode from 'vscode'

const SYSTEM = `You are an AI governance engineer. Extract individual guardrail rules from the policy document.
Return a JSON array of objects with fields: name (string ≤ 8 words), description (string, precise and enforceable),
severity ("critical"|"high"|"medium"|"low"), suggestedCategory (string — the category name this rule belongs to),
suggestedVector ("pre-call hook"|"output filter"|"middleware"|"test assertion"|"manual review").
Respond with valid JSON only.`

export interface RawPolicy {
  name: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  suggestedCategory: string
  suggestedVector: string
}

export async function extractPolicies(
  text: string,
  token?: vscode.CancellationToken
): Promise<RawPolicy[]> {
  return callLLMJson<RawPolicy[]>(
    `Extract guardrail policies from this policy document:\n\n${text.slice(0, 8000)}`,
    SYSTEM,
    token
  )
}
