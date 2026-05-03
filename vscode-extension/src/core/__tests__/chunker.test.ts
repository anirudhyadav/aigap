import { chunkPolicyDoc } from '../chunker'
import { RawPolicyDoc } from '../models/policy'

describe('chunkPolicyDoc', () => {
  test('returns single chunk for short document', () => {
    const doc: RawPolicyDoc = { text: 'Short policy text', source: 'test.md', fileType: 'markdown' }
    const chunks = chunkPolicyDoc(doc)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('Short policy text')
    expect(chunks[0].index).toBe(0)
    expect(chunks[0].total).toBe(1)
  })

  test('splits long document into multiple chunks', () => {
    const longText = 'A'.repeat(50000)
    const doc: RawPolicyDoc = { text: longText, source: 'big.md', fileType: 'markdown' }
    const chunks = chunkPolicyDoc(doc)
    expect(chunks.length).toBeGreaterThan(1)

    const reconstructed = chunks.map(c => c.text).join('')
    expect(reconstructed).toBe(longText)
  })

  test('splits at paragraph boundaries when possible', () => {
    const para = 'x'.repeat(20000)
    const text = `${para}\n\n${para}\n\n${para}`
    const doc: RawPolicyDoc = { text, source: 'test.md', fileType: 'markdown' }
    const chunks = chunkPolicyDoc(doc)
    expect(chunks.length).toBeGreaterThanOrEqual(2)
  })

  test('chunk totals are correct', () => {
    const longText = 'A'.repeat(60000)
    const doc: RawPolicyDoc = { text: longText, source: 'big.md', fileType: 'markdown' }
    const chunks = chunkPolicyDoc(doc)
    for (const chunk of chunks) {
      expect(chunk.total).toBe(chunks.length)
    }
  })
})
