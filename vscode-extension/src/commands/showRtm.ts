import * as vscode from 'vscode'
import { RtmTreeProvider } from '../views/RtmTreeProvider'

let treeProvider: RtmTreeProvider | undefined

export function setTreeProvider(provider: RtmTreeProvider): void {
  treeProvider = provider
}

export async function commandShowRtm(): Promise<void> {
  if (treeProvider) {
    treeProvider.refresh()
    vscode.window.showInformationMessage('aigap: Traceability matrix refreshed.')
  } else {
    vscode.window.showWarningMessage('aigap: Tree view not initialized.')
  }
}
