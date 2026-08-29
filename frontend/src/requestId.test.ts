import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRequestId } from './requestId'

describe('createRequestId', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a valid v4 UUID when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0xab),
    })

    expect(createRequestId()).toBe('abababab-abab-4bab-abab-abababababab')
  })
})
