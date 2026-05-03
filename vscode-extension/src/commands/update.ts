import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { loadPoliciesContext } from '../workspace/reader'
import { getAigapDir } from '../workspace/detector'
import { writePolicies } from '../workspace/writer'
import { readRegistry, nextId, writeRegistry } from '../core/registry'

export async function commandUpdate(): Promise<void> {
  const aigapDir = getAigapDir()
  const { content: currentPolicies } = loadPoliciesContext(aigapDir)

  if (!currentPolicies.trim()) {
    vscode.window.showWarningMessage('aigap: No .aigap/ context found. Run aigap: Initialize first.')
    return
  }

  const ruleText = await vscode.window.showInputBox({
    prompt: 'New rule from governance team',
    placeHolder: 'Paste the new rule text here...',
    ignoreFocusOut: true
  })
  if (!ruleText?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Updating policy...', cancellable: true },
    async (_, token) => {
      let registry = readRegistry(aigapDir)
      const { id, registry: r } = nextId(registry, 'GP')
      registry = r

      const SYSTEM = `You are an AI governance engineer. Given the current POLICIES.md and a new rule,
produce the updated POLICIES.md with the new rule appended to the correct category table.
The new policy ID is ${id}. Add a changelog entry at the bottom.
Return the complete updated POLICIES.md.`

      const response = await callLLM(
        `CURRENT POLICIES.md:\n${currentPolicies.slice(0, 6000)}\n\nNEW RULE:\n${ruleText}`,
        SYSTEM,
        token
      )

      writePolicies(aigapDir, response.text)
      writeRegistry(aigapDir, registry)

      vscode.window.showInformationMessage(`aigap: Policy ${id} added successfully.`)
    }
  )
}
