import type { DocumentSnapshot, ProblemResponse } from './model'

export class ApiProblem extends Error {
  constructor(public readonly problem: ProblemResponse) {
    super(problem.detail)
  }
}

export async function getDocument(apiBaseUrl: string, documentId: string, signal?: AbortSignal) {
  const response = await fetch(`${apiBaseUrl}/api/documents/${documentId}`, {
    cache: 'no-store',
    signal,
  })
  return parseResponse(response)
}

export async function approveDocument(
  apiBaseUrl: string,
  documentId: string,
  expectedVersion: string,
  requestId: string,
) {
  const timeout = new AbortController()
  const timeoutId = window.setTimeout(
    () => timeout.abort(new DOMException('Approval outcome timed out', 'TimeoutError')),
    8_000,
  )
  try {
    const response = await fetch(`${apiBaseUrl}/api/documents/${documentId}/approve`, {
      method: 'POST',
      signal: timeout.signal,
      headers: {
        'If-Match': `"v${expectedVersion}"`,
        'X-Request-Id': requestId,
      },
    })
    return parseResponse(response)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function armInvalidationFirst(apiBaseUrl: string, documentId: string) {
  const response = await fetch(`${apiBaseUrl}/api/test/scenarios/${documentId}/arm-invalidation-first`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('No fue posible armar el escenario')
}

export async function resetDocument(apiBaseUrl: string, documentId: string) {
  const response = await fetch(`${apiBaseUrl}/api/test/documents/${documentId}/reset`, { method: 'POST' })
  return parseResponse(response)
}

async function parseResponse(response: Response): Promise<DocumentSnapshot> {
  const body = await response.json()
  if (!response.ok) throw new ApiProblem(body as ProblemResponse)
  return body as DocumentSnapshot
}
