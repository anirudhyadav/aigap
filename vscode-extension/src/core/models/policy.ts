export type FileType = 'pdf' | 'docx' | 'markdown'

export interface RawPolicyDoc {
  text: string
  source: string
  fileType: FileType
}

export interface PolicyChunk {
  text: string
  index: number
  total: number
}

export interface GuardrailCategory {
  id: string
  name: string
  description: string
}

export interface GuardrailPolicy {
  id: string
  name: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  vector: string
  status: 'gap' | 'enforced' | 'partial' | 'deprecated'
}

export interface EnforcementVector {
  id: string
  type: 'pre-call hook' | 'output filter' | 'middleware' | 'test assertion' | 'manual review'
  description: string
}

export interface PolicyContent {
  categories: GuardrailCategory[]
  policies: GuardrailPolicy[]
  vectors: EnforcementVector[]
}

export interface Ambiguity {
  id: string
  term: string
  context: string
  suggestion: string
}

export interface Conflict {
  policyA: string
  policyB: string
  description: string
}

export interface GeneratedOutputs {
  policiesMd: string
  enforcementStubs: string
  rtm: string
  ambiguities: Ambiguity[]
  conflicts: Conflict[]
}

export interface RTMEntry {
  policyId: string
  policyName: string
  enforcementFiles: string[]
  testFiles: string[]
  status: 'enforced' | 'partial' | 'gap'
}
