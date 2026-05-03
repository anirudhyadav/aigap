import { PolicyChunk, RawPolicyDoc } from './models/policy'

const MAX_CHUNK_CHARS = 24000

export function chunkPolicyDoc(doc: RawPolicyDoc): PolicyChunk[] {
  const text = doc.text
  if (text.length <= MAX_CHUNK_CHARS) {
    return [{ text, index: 0, total: 1 }]
  }

  const chunks: PolicyChunk[] = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_CHARS, text.length)
    if (end < text.length) {
      const lastBreak = text.lastIndexOf('\n\n', end)
      if (lastBreak > start) { end = lastBreak }
    }
    chunks.push({ text: text.slice(start, end), index: chunks.length, total: 0 })
    start = end
  }

  for (const c of chunks) { c.total = chunks.length }
  return chunks
}
