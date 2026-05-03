import { RawPolicyDoc } from '../models/policy'

export async function parseDocx(filePath: string): Promise<RawPolicyDoc> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ path: filePath })
  return { text: result.value, source: filePath, fileType: 'docx' }
}
