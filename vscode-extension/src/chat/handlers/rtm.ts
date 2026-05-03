import * as vscode from 'vscode'
import { loadPoliciesContext } from '../../workspace/reader'
import { getAigapDir } from '../../workspace/detector'

export async function handleRtm(
  stream: vscode.ChatResponseStream
): Promise<void> {
  const aigapDir = getAigapDir()
  const { content } = loadPoliciesContext(aigapDir)

  if (!content.trim()) {
    stream.markdown('No `.aigap/` context found. Run **aigap: Initialize from Policy Doc** first.')
    return
  }

  const policyRows = [...content.matchAll(/^\| (GP-\d+) \| (.+?) \| .+? \| (.+?) \| (.+?) \| (.+?) \|$/gm)]
  if (policyRows.length === 0) {
    stream.markdown('No policies found in POLICIES.md.')
    return
  }

  let md = '| ID | Name | Severity | Status |\n|---|---|---|---|\n'
  for (const row of policyRows) {
    md += `| ${row[1]} | ${row[2].trim()} | ${row[4].trim()} | ${row[5].trim()} |\n`
  }

  stream.markdown(md)
}
