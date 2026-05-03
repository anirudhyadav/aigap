import { callLLMJson } from '../../llm/client'
import { EnforcementVector } from '../models/policy'
import * as vscode from 'vscode'

const SYSTEM = `You are an AI governance engineer. Identify distinct enforcement vectors from the policy document.
Return a JSON array of objects with fields: type ("pre-call hook"|"output filter"|"middleware"|"test assertion"|"manual review"),
description (string).
Respond with valid JSON only.`

export async function extractVectors(
  text: string,
  token?: vscode.CancellationToken
): Promise<Omit<EnforcementVector, 'id'>[]> {
  return callLLMJson<Omit<EnforcementVector, 'id'>[]>(
    `Identify enforcement vectors from this policy document:\n\n${text.slice(0, 8000)}`,
    SYSTEM,
    token
  )
}
