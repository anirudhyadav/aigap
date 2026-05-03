export function buildQueryPrompt(question: string, policiesContext: string): string {
  return `POLICIES CONTEXT:\n${policiesContext.slice(0, 6000)}\n\nQUESTION:\n${question}`
}

export function buildReleaseNotesPrompt(policiesContext: string, gitDiff: string): string {
  return `POLICIES:\n${policiesContext.slice(0, 3000)}\n\nGIT CHANGES:\n${gitDiff.slice(0, 3000)}`
}

export function buildSprintFeedPrompt(policiesContext: string): string {
  return `Generate sprint-ready task cards for every gap/partial policy:\n\n${policiesContext.slice(0, 6000)}`
}

export function buildFrameworkMapPrompt(policiesContext: string): string {
  return `Map each policy to EU AI Act, NIST AI RMF, ISO 42001, SOC 2 clauses:\n\n${policiesContext.slice(0, 6000)}`
}
