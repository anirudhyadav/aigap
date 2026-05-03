import { callLLM } from '../../llm/client'
import * as vscode from 'vscode'

const SYSTEM = `You are a governance auditor. Given guardrail policies and source code, identify
which policies are enforced, partially enforced, or missing.
Format as markdown with:
- Coverage Summary table (ID | Policy | Status | Notes)
- Coverage Score
- Missing Policies (Action Required)
- Partial Coverage (Review Needed)
- Recommendations`

export async function analyzeGap(
  policiesContext: string,
  sourceCode: string,
  token?: vscode.CancellationToken
): Promise<string> {
  const response = await callLLM(
    `POLICIES:\n${policiesContext.slice(0, 4000)}\n\nSOURCE CODE:\n${sourceCode.slice(0, 4000)}`,
    SYSTEM,
    token
  )
  return response.text
}
