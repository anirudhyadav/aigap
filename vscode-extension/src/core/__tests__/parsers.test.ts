import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { parseMarkdown } from '../parsers/markdown'

describe('parseMarkdown', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aigap-parser-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('reads markdown file and returns RawPolicyDoc', () => {
    const filePath = path.join(tmpDir, 'test-policy.md')
    fs.writeFileSync(filePath, '# Policy\n\nRule 1: No PII', 'utf-8')

    const doc = parseMarkdown(filePath)
    expect(doc.text).toBe('# Policy\n\nRule 1: No PII')
    expect(doc.source).toBe(filePath)
    expect(doc.fileType).toBe('markdown')
  })

  test('handles empty markdown file', () => {
    const filePath = path.join(tmpDir, 'empty.md')
    fs.writeFileSync(filePath, '', 'utf-8')

    const doc = parseMarkdown(filePath)
    expect(doc.text).toBe('')
    expect(doc.fileType).toBe('markdown')
  })
})
