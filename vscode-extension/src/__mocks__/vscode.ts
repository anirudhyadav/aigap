export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/mock/workspace' }, name: 'mock-project' }],
  getConfiguration: () => ({
    get: (key: string, defaultValue: unknown) => defaultValue
  })
}

export const window = {
  showOpenDialog: jest.fn(),
  showInputBox: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  withProgress: jest.fn(),
  activeTextEditor: undefined,
  createWebviewPanel: jest.fn(() => ({
    webview: { html: '' },
    reveal: jest.fn(),
    onDidDispose: jest.fn(),
    dispose: jest.fn()
  })),
  registerTreeDataProvider: jest.fn()
}

export const commands = {
  registerCommand: jest.fn()
}

export const lm = {
  selectChatModels: jest.fn()
}

export const chat = {
  createChatParticipant: jest.fn(() => ({
    iconPath: undefined
  }))
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}

export class TreeItem {
  label: string
  collapsibleState: TreeItemCollapsibleState
  iconPath: unknown
  constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
    this.label = label
    this.collapsibleState = collapsibleState ?? TreeItemCollapsibleState.None
  }
}

export class ThemeIcon {
  id: string
  constructor(id: string) { this.id = id }
}

export enum ProgressLocation {
  Notification = 15
}

export enum ViewColumn {
  Beside = -2
}

export class EventEmitter {
  event = jest.fn()
  fire = jest.fn()
  dispose = jest.fn()
}

export class CancellationTokenSource {
  token = { isCancellationRequested: false }
  cancel = jest.fn()
  dispose = jest.fn()
}

export const LanguageModelChatMessage = {
  User: (content: string) => ({ role: 'user', content })
}

export const Uri = {
  joinPath: (...args: unknown[]) => args.join('/')
}
