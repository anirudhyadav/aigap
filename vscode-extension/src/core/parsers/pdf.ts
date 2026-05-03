import { RawPolicyDoc } from '../models/policy'

export async function parsePdf(filePath: string): Promise<RawPolicyDoc> {
  const pdfParse = await import('pdf-parse')
  const fs = await import('fs')
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse.default(buffer)
  return { text: data.text, source: filePath, fileType: 'pdf' }
}
