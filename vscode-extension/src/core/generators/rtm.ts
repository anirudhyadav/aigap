import { PolicyContent, RTMEntry } from '../models/policy'

export function generateRTM(content: PolicyContent): string {
  const lines: string[] = [
    '# Policy Traceability Matrix',
    '',
    '| Policy ID | Policy Name | Severity | Vector | Status |',
    '|---|---|---|---|---|'
  ]

  for (const p of content.policies) {
    const statusEmoji = p.status === 'enforced' ? '✅' :
                        p.status === 'partial' ? '⚠️' : '🔲'
    lines.push(`| ${p.id} | ${p.name} | ${p.severity} | ${p.vector} | ${statusEmoji} ${p.status} |`)
  }

  return lines.join('\n')
}
