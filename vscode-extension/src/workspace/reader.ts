import * as fs from 'fs'
import * as path from 'path'
import { parseYamlPolicy } from '../core/parsers/yaml'

export function loadPoliciesContext(aigapDir: string): { content: string } {
  const policiesPath = path.join(aigapDir, 'POLICIES.md')
  if (fs.existsSync(policiesPath)) {
    return { content: fs.readFileSync(policiesPath, 'utf-8') }
  }

  const yamlPath = path.join(path.dirname(aigapDir), '.aigap-policy.yaml')
  if (fs.existsSync(yamlPath)) {
    const config = parseYamlPolicy(yamlPath)
    const lines = [
      `# POLICIES — ${config.name}`,
      `version: ${config.version ?? '1'}`,
      '',
      '| ID | Name | Description | Severity | Category |',
      '|---|---|---|---|---|'
    ]
    for (const rule of config.rules) {
      lines.push(`| ${rule.id} | ${rule.name} | ${rule.description} | ${rule.severity} | ${rule.category} |`)
    }
    return { content: lines.join('\n') }
  }

  return { content: '' }
}

export function loadFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}
