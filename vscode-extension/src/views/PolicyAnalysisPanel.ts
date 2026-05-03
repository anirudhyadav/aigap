import * as vscode from 'vscode'

export interface AnalysisSummary {
  categories: number
  policies: number
  vectors: number
  ambiguityCount: number
  conflictCount: number
  aigapDir: string
}

export class PolicyAnalysisPanel {
  private static currentPanel: PolicyAnalysisPanel | undefined
  private readonly panel: vscode.WebviewPanel
  private disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, summary: AnalysisSummary) {
    this.panel = panel
    this.panel.webview.html = this.buildHtml(summary)
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
  }

  static show(context: vscode.ExtensionContext, summary: AnalysisSummary): void {
    if (PolicyAnalysisPanel.currentPanel) {
      PolicyAnalysisPanel.currentPanel.panel.reveal()
      PolicyAnalysisPanel.currentPanel.panel.webview.html =
        PolicyAnalysisPanel.currentPanel.buildHtml(summary)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      'aigapAnalysis',
      'aigap — Analysis Result',
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    )

    PolicyAnalysisPanel.currentPanel = new PolicyAnalysisPanel(panel, summary)
    context.subscriptions.push(PolicyAnalysisPanel.currentPanel.panel)
  }

  private buildHtml(s: AnalysisSummary): string {
    const warnings: string[] = []
    if (s.ambiguityCount > 0) warnings.push(`⚠️ ${s.ambiguityCount} ambiguous term(s) — review <code>.aigap/ambiguity-report.md</code>`)
    if (s.conflictCount > 0) warnings.push(`🔴 ${s.conflictCount} conflict(s) detected — review <code>.aigap/conflict-report.md</code>`)

    const warningHtml = warnings.length > 0
      ? `<div class="warnings"><ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`
      : '<p class="ok">✅ No ambiguities or conflicts detected.</p>'

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
  h1 { font-size: 1.4em; margin-bottom: 4px; }
  .subtitle { color: var(--vscode-descriptionForeground); font-size: 0.9em; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .card { background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 6px; padding: 12px; }
  .card .num { font-size: 2em; font-weight: bold; }
  .card .label { font-size: 0.8em; color: var(--vscode-descriptionForeground); }
  .warnings { background: var(--vscode-inputValidation-warningBackground); padding: 10px 16px; border-radius: 6px; }
  .ok { color: var(--vscode-terminal-ansiGreen); }
  ul { margin: 4px 0; padding-left: 20px; }
  code { font-family: var(--vscode-editor-font-family); }
</style>
</head>
<body>
<h1>aigap Initialization Complete</h1>
<p class="subtitle">.aigap/ folder created and populated</p>

<div class="grid">
  <div class="card"><div class="num">${s.categories}</div><div class="label">Guardrail Categories</div></div>
  <div class="card"><div class="num">${s.policies}</div><div class="label">Guardrail Policies</div></div>
  <div class="card"><div class="num">${s.vectors}</div><div class="label">Enforcement Vectors</div></div>
  <div class="card"><div class="num">${s.ambiguityCount}</div><div class="label">Ambiguities</div></div>
  <div class="card"><div class="num">${s.conflictCount}</div><div class="label">Conflicts</div></div>
</div>

<h3>Quality Checks</h3>
${warningHtml}

<h3>Next Steps</h3>
<ul>
  <li>Review <code>.aigap/POLICIES.md</code></li>
  <li>Run <strong>aigap: Generate Enforcement</strong> for enforcement stubs</li>
  <li>Use <strong>@aigap tasks</strong> in Copilot Chat for enforcement tasks</li>
  <li>Run <strong>aigap: Generate Release Notes</strong> before release</li>
</ul>
</body>
</html>`
  }

  dispose(): void {
    PolicyAnalysisPanel.currentPanel = undefined
    this.panel.dispose()
    this.disposables.forEach(d => d.dispose())
  }
}
