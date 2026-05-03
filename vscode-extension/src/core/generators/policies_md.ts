import { PolicyContent } from '../models/policy'

export function generatePoliciesMd(content: PolicyContent, projectName: string): string {
  const date = new Date().toISOString().split('T')[0]
  const lines: string[] = [
    `# POLICIES — ${projectName}`,
    `<!-- aigap v0.1.0 · generated · ${date} -->`,
    '',
    `version: 1.0`,
    `updated: ${date}`,
    `author: Anirudh Yadav`,
    '',
    '---',
    '',
    '## Summary',
    '',
    '| Type | Count |',
    '|---|---|',
    `| Guardrail Categories (GC) | ${content.categories.length} |`,
    `| Guardrail Policies (GP) | ${content.policies.length} |`,
    `| Enforcement Vectors (EV) | ${content.vectors.length} |`,
    '',
    '---',
    '',
    '## Enforcement Vectors',
    '',
    '| ID | Type | Description |',
    '|---|---|---|'
  ]

  for (const v of content.vectors) {
    lines.push(`| ${v.id} | ${v.type} | ${v.description} |`)
  }
  lines.push('')

  for (const cat of content.categories) {
    lines.push('---', '', `## ${cat.id}: ${cat.name}`, '', cat.description, '')
    lines.push('| ID | Name | Description | Severity | Vector | Status |')
    lines.push('|---|---|---|---|---|---|')

    const catPolicies = content.policies.filter(p => p.category === cat.id)
    for (const p of catPolicies) {
      const statusEmoji = p.status === 'enforced' ? '✅ enforced' :
                          p.status === 'partial' ? '⚠️ partial' :
                          p.status === 'deprecated' ? '[DEPRECATED]' : '🔲 gap'
      lines.push(`| ${p.id} | ${p.name} | ${p.description} | ${p.severity} | ${p.vector} | ${statusEmoji} |`)
    }
    lines.push('')
  }

  lines.push('---', '', '## Deprecated', '', '_(none)_', '')
  return lines.join('\n')
}

export function generateChangelogEntry(version: string, summary: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `- ${date} v${version}: ${summary}`
}
