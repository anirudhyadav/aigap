import * as fs from 'fs'
import { RawPolicyDoc } from '../models/policy'

export function parseMarkdown(filePath: string): RawPolicyDoc {
  return {
    text: fs.readFileSync(filePath, 'utf-8'),
    source: filePath,
    fileType: 'markdown'
  }
}
