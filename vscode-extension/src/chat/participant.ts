import * as vscode from 'vscode'
import { handleAnalyze } from './handlers/analyze'
import { handleTasks } from './handlers/tasks'
import { handleCoverage } from './handlers/coverage'
import { handleRtm } from './handlers/rtm'

export function registerChatParticipant(context: vscode.ExtensionContext): void {
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    _chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => {
    const prompt = request.prompt.trim().toLowerCase()

    if (prompt === 'tasks') {
      await handleTasks(request, stream, token)
    } else if (prompt === 'coverage') {
      await handleCoverage(request, stream, token)
    } else if (prompt === 'rtm') {
      await handleRtm(stream)
    } else if (prompt === 'help') {
      stream.markdown(`### @aigap commands\n\n` +
        '| Command | What it does |\n' +
        '|---|---|\n' +
        '| `@aigap <question>` | Ask about any policy by ID or topic |\n' +
        '| `@aigap tasks` | List open enforcement tasks |\n' +
        '| `@aigap coverage` | Gap report for current file |\n' +
        '| `@aigap rtm` | Show traceability matrix summary |\n')
    } else {
      await handleAnalyze(request, stream, token)
    }
  }

  const participant = vscode.chat.createChatParticipant('aigap.assistant', handler)
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png')
  context.subscriptions.push(participant)
}
