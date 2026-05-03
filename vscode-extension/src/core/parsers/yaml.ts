import * as fs from 'fs'

export interface YamlPolicyRule {
  id: string
  name: string
  description: string
  category: 'guardrail' | 'policy'
  severity: 'critical' | 'high' | 'medium' | 'low'
  plugin?: string
  params?: Record<string, unknown>
  fast_patterns?: string[]
}

export interface YamlPolicyConfig {
  version?: string
  name: string
  rules: YamlPolicyRule[]
  block_on?: string[]
  drift_threshold_pct?: number
}

export function parseYamlPolicy(filePath: string): YamlPolicyConfig {
  const content = fs.readFileSync(filePath, 'utf-8')

  const nameMatch = content.match(/^name:\s*(.+)$/m)
  const name = nameMatch?.[1]?.trim().replace(/^["']|["']$/g, '') ?? 'Untitled'

  const rules: YamlPolicyRule[] = []
  const ruleBlocks = content.split(/^ {2}- /m).slice(1)

  for (const block of ruleBlocks) {
    const get = (key: string): string => {
      const m = block.match(new RegExp(`${key}:\\s*(.+)`))
      return m?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''
    }

    const id = get('id')
    const ruleName = get('name')
    const description = get('description')
    const category = (get('category') || 'guardrail') as 'guardrail' | 'policy'
    const severity = (get('severity') || 'high') as 'critical' | 'high' | 'medium' | 'low'
    const plugin = get('plugin') || undefined

    if (id && ruleName) {
      rules.push({ id, name: ruleName, description, category, severity, plugin })
    }
  }

  const versionMatch = content.match(/^version:\s*["']?(.+?)["']?\s*$/m)
  const version = versionMatch?.[1] ?? '1'

  const blockOnMatch = content.match(/^block_on:\s*\[(.+)\]/m)
  const block_on = blockOnMatch?.[1]?.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))

  const driftMatch = content.match(/^drift_threshold_pct:\s*(\d+\.?\d*)/m)
  const drift_threshold_pct = driftMatch ? parseFloat(driftMatch[1]) : undefined

  return { version, name, rules, block_on, drift_threshold_pct }
}
