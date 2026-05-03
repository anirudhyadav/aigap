import { callLLM } from '../../llm/client'
import { PolicyContent } from '../models/policy'
import * as vscode from 'vscode'

const SYSTEM = `You are a senior engineer generating enforcement stubs for an AI guardrail system.
For each policy marked as gap, generate a Python implementation stub matching the enforcement vector type.
Include imports, docstring referencing the policy ID, and core logic.
Format as markdown with separate code blocks for each policy.`

export async function generateEnforcementStubs(
  content: PolicyContent,
  token?: vscode.CancellationToken
): Promise<string> {
  const gapPolicies = content.policies.filter(p => p.status === 'gap')
  if (gapPolicies.length === 0) { return '# No gap policies — all enforced!' }

  const policySummary = gapPolicies.map(p => {
    const vec = content.vectors.find(v => v.id === p.vector)
    return `- ${p.id}: ${p.name} (${p.severity}) — Vector: ${p.vector} (${vec?.type ?? 'unknown'})\n  Description: ${p.description}`
  }).join('\n')

  const response = await callLLM(
    `Generate enforcement stubs for these policies:\n\n${policySummary}`,
    SYSTEM,
    token
  )
  return response.text
}
