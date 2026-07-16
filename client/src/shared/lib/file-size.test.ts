import { describe, expect, it } from 'vitest'
import { formatBinaryFileSize } from './file-size'

describe('formatBinaryFileSize', () => {
  it.each([
    [0, '1 KB'],
    [512, '1 KB'],
    [1536, '2 KB'],
    [1024 * 1024, '1.0 MB'],
    [1572864, '1.5 MB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatBinaryFileSize(bytes)).toBe(expected)
  })
})
