import { callLLM } from '../../llm/client'
import * as vscode from 'vscode'

export interface ImpactItem {
  id: string
  description: string
  impactType: 'new' | 'modified' | 'removed' | 'breaking'
}

const SYSTEM = `You are a governance engineer performing change impact analysis.
Compare the current policies against the new policy document.
Identify: new rules, modified rules, removed rules, breaking changes.
Format as markdown with sections: Summary, New Rules, Modified Rules, Removed Rules, Breaking Changes, Recommendations.`

export async function analyzeChangeImpact(
  currentPolicies: string,
  newDocument: string,
  token?: vscode.CancellationToken
): Promise<string> {
  const response = await callLLM(
    `CURRENT POLICIES:\n${currentPolicies.slice(0, 4000)}\n\nNEW DOCUMENT:\n${newDocument.slice(0, 4000)}`,
    SYSTEM,
    token
  )
  return response.text
}
