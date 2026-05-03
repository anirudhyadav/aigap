import { generatePoliciesMd, generateChangelogEntry } from '../generators/policies_md'
import { generateRTM } from '../generators/rtm'
import { PolicyContent } from '../models/policy'

const sampleContent: PolicyContent = {
  categories: [
    { id: 'GC-001', name: 'Data Privacy', description: 'Policies related to data privacy' },
    { id: 'GC-002', name: 'Safety', description: 'Policies related to AI safety' }
  ],
  policies: [
    {
      id: 'GP-001', name: 'PII Filter', description: 'Block PII in outputs',
      severity: 'critical', category: 'GC-001', vector: 'EV-001', status: 'gap'
    },
    {
      id: 'GP-002', name: 'Harm Prevention', description: 'Prevent harmful content',
      severity: 'high', category: 'GC-002', vector: 'EV-002', status: 'enforced'
    }
  ],
  vectors: [
    { id: 'EV-001', type: 'output filter', description: 'Filter PII from LLM output' },
    { id: 'EV-002', type: 'pre-call hook', description: 'Check prompt before LLM call' }
  ]
}

describe('generatePoliciesMd', () => {
  test('generates valid markdown with all sections', () => {
    const md = generatePoliciesMd(sampleContent, 'TestProject')
    expect(md).toContain('# POLICIES — TestProject')
    expect(md).toContain('## Summary')
    expect(md).toContain('Guardrail Categories (GC) | 2')
    expect(md).toContain('Guardrail Policies (GP) | 2')
    expect(md).toContain('Enforcement Vectors (EV) | 2')
  })

  test('includes all categories', () => {
    const md = generatePoliciesMd(sampleContent, 'TestProject')
    expect(md).toContain('## GC-001: Data Privacy')
    expect(md).toContain('## GC-002: Safety')
  })

  test('places policies under correct categories', () => {
    const md = generatePoliciesMd(sampleContent, 'TestProject')
    const gc001Start = md.indexOf('## GC-001: Data Privacy')
    const gc002Start = md.indexOf('## GC-002: Safety')
    const gc001Section = md.slice(gc001Start, gc002Start)
    expect(gc001Section).toContain('GP-001')
    expect(gc001Section).not.toContain('GP-002')
  })

  test('shows correct status emojis', () => {
    const md = generatePoliciesMd(sampleContent, 'TestProject')
    expect(md).toContain('🔲 gap')
    expect(md).toContain('✅ enforced')
  })

  test('includes enforcement vectors table', () => {
    const md = generatePoliciesMd(sampleContent, 'TestProject')
    expect(md).toContain('EV-001')
    expect(md).toContain('output filter')
    expect(md).toContain('EV-002')
    expect(md).toContain('pre-call hook')
  })
})

describe('generateRTM', () => {
  test('generates valid traceability matrix', () => {
    const rtm = generateRTM(sampleContent)
    expect(rtm).toContain('# Policy Traceability Matrix')
    expect(rtm).toContain('GP-001')
    expect(rtm).toContain('GP-002')
  })

  test('shows correct status for each policy', () => {
    const rtm = generateRTM(sampleContent)
    expect(rtm).toContain('🔲 gap')
    expect(rtm).toContain('✅ enforced')
  })
})

describe('generateChangelogEntry', () => {
  test('formats changelog entry with version and summary', () => {
    const entry = generateChangelogEntry('1.0', 'Initial policy set')
    expect(entry).toMatch(/- \d{4}-\d{2}-\d{2} v1\.0: Initial policy set/)
  })
})
