import { callLLMJson } from '../../llm/client'
import { GuardrailCategory } from '../models/policy'
import * as vscode from 'vscode'

const SYSTEM = `You are an AI governance engineer. Extract distinct policy groupings from the policy document.
Return a JSON array of objects with fields: name (string), description (string).
Respond with valid JSON only.`

export async function extractCategories(
  text: string,
  token?: vscode.CancellationToken
): Promise<Omit<GuardrailCategory, 'id'>[]> {
  return callLLMJson<Omit<GuardrailCategory, 'id'>[]>(
    `Extract guardrail categories from this policy document:\n\n${text.slice(0, 8000)}`,
    SYSTEM,
    token
  )
}
