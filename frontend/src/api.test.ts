import { afterEach, describe, expect, it, vi } from 'vitest'
import { approveDocument } from './api'

describe('approveDocument', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('aborts a request that never produces an outcome', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason))
    })))

    const approval = approveDocument('http://api', 'doc-1', '1', 'request-1')
    const rejection = expect(approval).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(8_000)

    await rejection
  })
})
