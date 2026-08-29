import { describe, expect, it } from 'vitest'
import type { DocumentSnapshot } from './model'
import { approvalReducer, initialState } from './state'

const snapshot = (version: string, status: DocumentSnapshot['status']): DocumentSnapshot => ({
  id: 'doc-1',
  title: 'Documento',
  status,
  version,
  updatedAt: '2026-08-28T00:00:00Z',
})

describe('approvalReducer', () => {
  it('rolls optimistic state toward the authoritative conflict snapshot', () => {
    const loaded = approvalReducer(initialState, { type: 'loaded', document: snapshot('1', 'PENDING_APPROVAL') })
    const pending = approvalReducer(loaded, { type: 'approvalStarted', requestId: 'request-1' })
    const conflicted = approvalReducer(pending, {
      type: 'conflict',
      requestId: 'request-1',
      code: 'STALE_VERSION',
      document: snapshot('2', 'INVALIDATED'),
    })

    expect(conflicted.optimisticStatus).toBeNull()
    expect(conflicted.authoritative?.status).toBe('INVALIDATED')
    expect(conflicted.authoritative?.version).toBe('2')
  })

  it('does not regress to a late older snapshot', () => {
    const current = approvalReducer(initialState, { type: 'loaded', document: snapshot('10', 'INVALIDATED') })
    expect(approvalReducer(current, { type: 'loaded', document: snapshot('9', 'APPROVED') })).toEqual(current)
  })

  it('forgets pending intent when the host changes document', () => {
    const loaded = approvalReducer(initialState, { type: 'loaded', document: snapshot('1', 'PENDING_APPROVAL') })
    const pending = approvalReducer(loaded, { type: 'approvalStarted', requestId: 'old-request' })

    expect(approvalReducer(pending, { type: 'documentChanged' })).toEqual(initialState)
  })
})
