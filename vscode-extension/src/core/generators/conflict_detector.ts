import { callLLMJson } from '../../llm/client'
import { Conflict } from '../models/policy'
import * as vscode from 'vscode'

const SYSTEM = `You are a governance auditor. Find any pairs of policies that contradict each other.
Return a JSON array of objects with fields: policyA (string — the first policy text),
policyB (string — the second policy text), description (string — why they conflict).
Return an empty array if no conflicts. Respond with valid JSON only.`

export async function detectConflicts(
  text: string,
  token?: vscode.CancellationToken
): Promise<Conflict[]> {
  return callLLMJson<Conflict[]>(
    `Find conflicting policies in this document:\n\n${text.slice(0, 8000)}`,
    SYSTEM,
    token
  )
}

export function formatConflictReport(conflicts: Conflict[]): string {
  if (conflicts.length === 0) return '# Conflict Report\n\nNo conflicting policies found.'

  const lines = [
    '# Conflict Report',
    '',
    '| # | Policy A | Policy B | Conflict |',
    '|---|---|---|---|'
  ]
  for (let i = 0; i < conflicts.length; i++) {
    const c = conflicts[i]
    lines.push(`| ${i + 1} | ${c.policyA} | ${c.policyB} | ${c.description} |`)
  }
  return lines.join('\n')
}
