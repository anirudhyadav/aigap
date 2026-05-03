import * as vscode from 'vscode'
import * as path from 'path'
import { parsePdf } from '../core/parsers/pdf'
import { parseDocx } from '../core/parsers/docx'
import { parseMarkdown } from '../core/parsers/markdown'
import { chunkPolicyDoc } from '../core/chunker'
import { extractCategories } from '../core/extractors/categories'
import { extractPolicies } from '../core/extractors/policies'
import { extractVectors } from '../core/extractors/vectors'
import { detectAmbiguities, formatAmbiguityReport } from '../core/generators/ambiguity_report'
import { detectConflicts, formatConflictReport } from '../core/generators/conflict_detector'
import { generatePoliciesMd } from '../core/generators/policies_md'
import { generateRTM } from '../core/generators/rtm'
import { readRegistry, writeRegistry, nextId } from '../core/registry'
import { getAigapDir, ensureAigapDir } from '../workspace/detector'
import { writePolicies, writeRTM, writeFile } from '../workspace/writer'
import { PolicyAnalysisPanel, AnalysisSummary } from '../views/PolicyAnalysisPanel'
import { PolicyContent, GuardrailCategory, GuardrailPolicy, EnforcementVector, Ambiguity } from '../core/models/policy'

export async function commandInit(context: vscode.ExtensionContext): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'Policy Documents': ['pdf', 'docx', 'doc', 'md'] },
    title: 'Select policy document'
  })
  if (!uris || uris.length === 0) return

  const filePath = uris[0].fsPath
  const ext = path.extname(filePath).toLowerCase()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aigap: Initializing from policy doc...', cancellable: true },
    async (progress, token) => {
      progress.report({ message: 'Parsing document...' })
      const rawDoc =
        ext === '.pdf' ? await parsePdf(filePath) :
        ext === '.md'  ? parseMarkdown(filePath) :
        await parseDocx(filePath)

      const chunks = chunkPolicyDoc(rawDoc)
      const fullText = chunks.map(c => c.text).join('\n')

      progress.report({ message: 'Extracting categories...' })
      const rawCategories = await extractCategories(fullText, token)

      progress.report({ message: 'Extracting policies...' })
      const rawPolicies = await extractPolicies(fullText, token)

      progress.report({ message: 'Extracting enforcement vectors...' })
      const rawVectors = await extractVectors(fullText, token)

      progress.report({ message: 'Detecting ambiguities...' })
      const rawAmbiguities = await detectAmbiguities(fullText, token)

      progress.report({ message: 'Detecting conflicts...' })
      const conflicts = await detectConflicts(fullText, token)

      const aigapDir = getAigapDir()
      ensureAigapDir(aigapDir)
      let registry = readRegistry(aigapDir)

      const categories: GuardrailCategory[] = rawCategories.map(c => {
        const { id, registry: r } = nextId(registry, 'GC')
        registry = r
        return { ...c, id }
      })

      const vectors: EnforcementVector[] = rawVectors.map(v => {
        const { id, registry: r } = nextId(registry, 'EV')
        registry = r
        return { ...v, id }
      })

      const policies: GuardrailPolicy[] = rawPolicies.map(p => {
        const { id, registry: r } = nextId(registry, 'GP')
        registry = r

        const matchedCat = categories.find(c =>
          c.name.toLowerCase().includes(p.suggestedCategory?.toLowerCase() ?? '') ||
          (p.suggestedCategory ?? '').toLowerCase().includes(c.name.toLowerCase())
        )
        const catId = matchedCat?.id ?? (categories.length > 0 ? categories[0].id : 'GC-001')

        const matchedVec = vectors.find(v => v.type === p.suggestedVector)
        const vecId = matchedVec?.id ?? (vectors.length > 0 ? vectors[0].id : 'EV-001')

        return {
          id,
          name: p.name,
          description: p.description,
          severity: p.severity,
          category: catId,
          vector: vecId,
          status: 'gap' as const
        }
      })

      const ambiguities: Ambiguity[] = rawAmbiguities.map((a, i) => ({
        ...a,
        id: `AMB-${String(i + 1).padStart(3, '0')}`
      }))

      const content: PolicyContent = { categories, policies, vectors }

      progress.report({ message: 'Writing .aigap/ files...' })
      const projectName = vscode.workspace.workspaceFolders?.[0]?.name ?? 'Project'
      writePolicies(aigapDir, generatePoliciesMd(content, projectName))
      writeRTM(aigapDir, generateRTM(content))
      writeFile(path.join(aigapDir, 'ambiguity-report.md'), formatAmbiguityReport(ambiguities))
      writeFile(path.join(aigapDir, 'conflict-report.md'), formatConflictReport(conflicts))
      writeRegistry(aigapDir, registry)

      const summary: AnalysisSummary = {
        categories: categories.length,
        policies: policies.length,
        vectors: vectors.length,
        ambiguityCount: ambiguities.length,
        conflictCount: conflicts.length,
        aigapDir
      }

      PolicyAnalysisPanel.show(context, summary)
      vscode.window.showInformationMessage(
        `aigap: Initialized — ${policies.length} policies, ${categories.length} categories, ${vectors.length} vectors.`
      )
    }
  )
}
