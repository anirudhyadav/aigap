import * as vscode from 'vscode'
import { commandInit } from './commands/init'
import { commandUpdate } from './commands/update'
import { commandEnforcement } from './commands/enforcement'
import { commandReleaseNotes } from './commands/releaseNotes'
import { commandShowRtm, setTreeProvider } from './commands/showRtm'
import { commandGapReport } from './commands/gapReport'
import { commandChangeImpact } from './commands/changeImpact'
import { commandValidate } from './commands/validate'
import { commandPrDraft } from './commands/prDraft'
import { commandSprintFeed } from './commands/sprintFeed'
import { commandAuditReport } from './commands/auditReport'
import { commandStatusReport } from './commands/statusReport'
import { commandFrameworkMap } from './commands/frameworkMap'
import { commandIngestConfluence } from './commands/ingestConfluence'
import { commandStaleness } from './commands/staleness'
import { commandEnforcementLink } from './commands/enforcementLink'
import { commandDeepEval } from './commands/deepEval'
import { commandIngestNotion } from './commands/ingestNotion'
import { commandIngestSharePoint } from './commands/ingestSharePoint'
import { commandIngestGoogleDocs } from './commands/ingestGoogleDocs'
import { registerChatParticipant } from './chat/participant'
import { RtmTreeProvider } from './views/RtmTreeProvider'

export function activate(context: vscode.ExtensionContext): void {
    const rtmProvider = new RtmTreeProvider()
    setTreeProvider(rtmProvider)

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('aigap.rtmView', rtmProvider),

        // ── Core ──────────────────────────────────────────────────────────────
        vscode.commands.registerCommand('aigap.init',            () => commandInit(context)),
        vscode.commands.registerCommand('aigap.update',          () => commandUpdate()),
        vscode.commands.registerCommand('aigap.enforcement',     () => commandEnforcement()),
        vscode.commands.registerCommand('aigap.releaseNotes',    () => commandReleaseNotes()),
        vscode.commands.registerCommand('aigap.showRtm',         () => commandShowRtm()),
        vscode.commands.registerCommand('aigap.gapReport',       () => commandGapReport()),

        // ── Analysis & Quality ────────────────────────────────────────────────
        vscode.commands.registerCommand('aigap.changeImpact',    () => commandChangeImpact()),
        vscode.commands.registerCommand('aigap.validate',        () => commandValidate()),
        vscode.commands.registerCommand('aigap.prDraft',         () => commandPrDraft()),

        // ── Delivery Tools ────────────────────────────────────────────────
        vscode.commands.registerCommand('aigap.sprintFeed',      () => commandSprintFeed()),
        vscode.commands.registerCommand('aigap.auditReport',     () => commandAuditReport()),
        vscode.commands.registerCommand('aigap.statusReport',    () => commandStatusReport()),
        vscode.commands.registerCommand('aigap.frameworkMap',     () => commandFrameworkMap()),

        // ── Ingestion & Traceability ──────────────────────────────────────────
        vscode.commands.registerCommand('aigap.ingestConfluence', () => commandIngestConfluence()),
        vscode.commands.registerCommand('aigap.staleness',       () => commandStaleness()),
        vscode.commands.registerCommand('aigap.enforcementLink', () => commandEnforcementLink()),

        // ── Additional Ingestion ──────────────────────────────────────────────
        vscode.commands.registerCommand('aigap.ingestNotion',    () => commandIngestNotion()),
        vscode.commands.registerCommand('aigap.ingestSharePoint', () => commandIngestSharePoint()),
        vscode.commands.registerCommand('aigap.ingestGoogleDocs', () => commandIngestGoogleDocs()),

        // ── Three-Stage Pipeline ────────────────────────────────────────────
        vscode.commands.registerCommand('aigap.deepEval',        () => commandDeepEval()),
    )

    registerChatParticipant(context)
}

export function deactivate(): void {}
