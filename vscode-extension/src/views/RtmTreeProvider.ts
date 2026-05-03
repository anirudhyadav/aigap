import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

interface PolicyItem {
  id: string
  name: string
  severity: string
  status: string
  category: string
}

export class RtmTreeProvider implements vscode.TreeDataProvider<RtmNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RtmNode | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: RtmNode): vscode.TreeItem {
    return element
  }

  getChildren(element?: RtmNode): RtmNode[] {
    if (!element) {
      return this.getRootNodes()
    }
    return element.children
  }

  private getRootNodes(): RtmNode[] {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!workspaceRoot) return []

    const policiesPath = path.join(workspaceRoot, '.aigap', 'POLICIES.md')
    if (!fs.existsSync(policiesPath)) {
      return [new RtmNode('No .aigap/ found — run aigap: Initialize', 'info', [])]
    }

    const content = fs.readFileSync(policiesPath, 'utf-8')
    const categories = this.parseCategories(content)

    return categories.map(cat => {
      const children = cat.policies.map(p => {
        const icon = p.status.includes('enforced') ? '✅' :
                     p.status.includes('partial') ? '⚠️' : '🔲'
        return new RtmNode(`${icon} ${p.id}: ${p.name}`, 'policy', [])
      })
      return new RtmNode(cat.name, 'category', children)
    })
  }

  private parseCategories(content: string): { name: string; policies: PolicyItem[] }[] {
    const categories: { name: string; policies: PolicyItem[] }[] = []
    const sectionRegex = /^## (GC-\d+: .+)$/gm
    const tableRowRegex = /^\| (GP-\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/gm

    let currentCategory: { name: string; policies: PolicyItem[] } | null = null

    for (const line of content.split('\n')) {
      const sectionMatch = line.match(/^## (GC-\d+: .+)$/)
      if (sectionMatch) {
        currentCategory = { name: sectionMatch[1], policies: [] }
        categories.push(currentCategory)
        continue
      }

      if (currentCategory) {
        const rowMatch = line.match(/^\| (GP-\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/)
        if (rowMatch) {
          currentCategory.policies.push({
            id: rowMatch[1],
            name: rowMatch[2].trim(),
            severity: rowMatch[4].trim(),
            status: rowMatch[6].trim(),
            category: currentCategory.name
          })
        }
      }
    }

    return categories
  }
}

export class RtmNode extends vscode.TreeItem {
  children: RtmNode[]

  constructor(
    label: string,
    private nodeType: 'category' | 'policy' | 'info',
    children: RtmNode[]
  ) {
    super(
      label,
      children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    )
    this.children = children

    if (nodeType === 'category') {
      this.iconPath = new vscode.ThemeIcon('folder')
    } else if (nodeType === 'policy') {
      this.iconPath = new vscode.ThemeIcon('shield')
    } else {
      this.iconPath = new vscode.ThemeIcon('info')
    }
  }
}
