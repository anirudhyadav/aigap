import { callLLMJson } from '../../llm/client'
import { Ambiguity } from '../models/policy'
import * as vscode from 'vscode'

const SYSTEM = `You are a governance auditor. Flag any vague or ambiguous terms in the policy document.
Return a JSON array of objects with fields: term (string), context (string — the sentence containing the term),
suggestion (string — a specific question to resolve the ambiguity).
Respond with valid JSON only.`

export async function detectAmbiguities(
  text: string,
  token?: vscode.CancellationToken
): Promise<Omit<Ambiguity, 'id'>[]> {
  return callLLMJson<Omit<Ambiguity, 'id'>[]>(
    `Flag ambiguous terms in this policy document:\n\n${text.slice(0, 8000)}`,
    SYSTEM,
    token
  )
}

export function formatAmbiguityReport(ambiguities: Ambiguity[]): string {
  if (ambiguities.length === 0) return '# Ambiguity Report\n\nNo ambiguous terms found.'

  const lines = [
    '# Ambiguity Report',
    '',
    '| # | Term | Context | Question for Governance |',
    '|---|---|---|---|'
  ]
  for (let i = 0; i < ambiguities.length; i++) {
    const a = ambiguities[i]
    lines.push(`| ${i + 1} | ${a.term} | ${a.context} | ${a.suggestion} |`)
  }
  return lines.join('\n')
}
