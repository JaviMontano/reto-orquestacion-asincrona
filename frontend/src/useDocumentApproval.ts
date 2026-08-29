import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiProblem, approveDocument, armInvalidationFirst, getDocument, resetDocument } from './api'
import type { ApprovalEvent } from './model'
import { createRequestId } from './requestId'
import { approvalReducer, initialState } from './state'

interface Options {
  documentId: string
  apiBaseUrl: string
  onEvent?: (event: ApprovalEvent) => void
}

export function useDocumentApproval({ documentId, apiBaseUrl, onEvent }: Options) {
  const [state, dispatch] = useReducer(approvalReducer, initialState)
  const activeRequest = useRef<string | null>(null)
  const targetKey = `${apiBaseUrl}\u0000${documentId}`
  const activeTarget = useRef(targetKey)
  activeTarget.current = targetKey

  const refresh = useCallback(async () => {
    if (activeRequest.current) return
    const requestedTarget = targetKey
    try {
      const document = await getDocument(apiBaseUrl, documentId)
      if (activeTarget.current === requestedTarget) dispatch({ type: 'loaded', document })
    } catch {
      if (activeTarget.current === requestedTarget) dispatch({ type: 'loadFailed' })
    }
  }, [apiBaseUrl, documentId, targetKey])

  useEffect(() => {
    const controller = new AbortController()
    const requestedTarget = targetKey
    activeRequest.current = null
    dispatch({ type: 'documentChanged' })
    getDocument(apiBaseUrl, documentId, controller.signal)
      .then((document) => {
        if (activeTarget.current === requestedTarget) dispatch({ type: 'loaded', document })
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && activeTarget.current === requestedTarget) {
          dispatch({ type: 'loadFailed' })
        }
      })
    return () => controller.abort()
  }, [apiBaseUrl, documentId, targetKey])

  const approve = useCallback(
    async (simulateConflict = false) => {
      if (activeRequest.current || !state.authoritative || state.phase !== 'stable') return
      const requestId = createRequestId()
      const requestedTarget = targetKey
      activeRequest.current = requestId
      const expectedVersion = state.authoritative.version
      dispatch({ type: 'approvalStarted', requestId })

      try {
        if (simulateConflict) await armInvalidationFirst(apiBaseUrl, documentId)
        const document = await approveDocument(apiBaseUrl, documentId, expectedVersion, requestId)
        if (activeTarget.current !== requestedTarget || activeRequest.current !== requestId) return
        dispatch({ type: 'approvalSucceeded', requestId, document })
        onEvent?.({ type: 'approved', document })
      } catch (error) {
        if (activeTarget.current !== requestedTarget || activeRequest.current !== requestId) return
        if (error instanceof ApiProblem && [409, 412].includes(error.problem.status) && error.problem.currentDocument) {
          const document = error.problem.currentDocument
          dispatch({ type: 'conflict', requestId, code: error.problem.code, document })
          onEvent?.({ type: 'conflict', code: error.problem.code, document })
        } else {
          dispatch({ type: 'outcomeUnknown', requestId })
          onEvent?.({ type: 'outcome-unknown' })
          try {
            const document = await getDocument(apiBaseUrl, documentId)
            if (activeTarget.current === requestedTarget && activeRequest.current === requestId) {
              dispatch({ type: 'loaded', document })
            }
          } catch {
            if (activeTarget.current === requestedTarget && activeRequest.current === requestId) {
              dispatch({ type: 'loadFailed' })
            }
          }
        }
      } finally {
        if (activeRequest.current === requestId) activeRequest.current = null
      }
    },
    [apiBaseUrl, documentId, onEvent, state.authoritative, state.phase, targetKey],
  )

  const reset = useCallback(async () => {
    if (activeRequest.current) return
    const requestedTarget = targetKey
    const document = await resetDocument(apiBaseUrl, documentId)
    if (activeTarget.current === requestedTarget) dispatch({ type: 'loaded', document })
  }, [apiBaseUrl, documentId, targetKey])

  return { state, approve, refresh, reset }
}
