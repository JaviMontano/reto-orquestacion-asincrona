import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentApprovalCard } from './DocumentApprovalCard'

const pending = {
  id: 'doc-1', title: 'Documento', status: 'PENDING_APPROVAL', version: '1', updatedAt: '2026-08-28T00:00:00Z',
}
const invalidated = { ...pending, status: 'INVALIDATED', version: '2' }

describe('DocumentApprovalCard', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-4111-8111-111111111111' })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('removes optimistic approval and adopts the authoritative 412 snapshot', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, pending))
      .mockResolvedValueOnce(response(200, { status: 'ARMED' }))
      .mockResolvedValueOnce(response(412, {
        type: 'test', title: 'STALE VERSION', status: 412, detail: 'stale', code: 'STALE_VERSION',
        requestId: '11111111-1111-4111-8111-111111111111', currentDocument: invalidated,
      }))
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" enableDemoControls />)
    await screen.findByText('Pendiente de aprobación')
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar con conflicto' }))

    await screen.findByText('Invalidado')
    expect(screen.getByRole('status')).toHaveTextContent('STALE_VERSION')
    expect(screen.getByTestId('document-version')).toHaveTextContent('v2')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })

  it('confirms a successful optimistic approval', async () => {
    const approved = { ...pending, status: 'APPROVED', version: '2' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, pending))
      .mockResolvedValueOnce(response(200, approved))
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))

    await screen.findByText('Aprobado')
    expect(screen.getByRole('status')).toHaveTextContent('Documento aprobado')
  })

  it('blocks duplicate approval, refresh and reset while a mutation is pending', async () => {
    let releaseApproval!: (value: Response) => void
    const approval = new Promise<Response>((resolve) => { releaseApproval = resolve })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, pending))
      .mockReturnValueOnce(approval)
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" enableDemoControls />)
    const button = await screen.findByRole('button', { name: 'Aprobar' })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Consultar servidor' }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Consultar servidor' })).toBeDisabled()

    await act(async () => releaseApproval(response(200, { ...pending, status: 'APPROVED', version: '2' })))
    await screen.findByText('Aprobado')
  })

  it('consults fresh state after an unknown outcome without retrying approval', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, pending))
      .mockRejectedValueOnce(new TypeError('network timeout'))
      .mockResolvedValueOnce(response(200, invalidated))
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))

    await screen.findByText('Invalidado')
    const postCalls = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')
    expect(postCalls).toHaveLength(1)
  })

  it('ignores a late response when the host changes document', async () => {
    let releaseOldApproval!: (value: Response) => void
    const oldApproval = new Promise<Response>((resolve) => { releaseOldApproval = resolve })
    const secondDocument = { ...pending, id: 'doc-2', title: 'Documento nuevo' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, pending))
      .mockReturnValueOnce(oldApproval)
      .mockResolvedValueOnce(response(200, secondDocument))
    vi.stubGlobal('fetch', fetchMock)
    const onEvent = vi.fn()

    const view = render(<DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" onEvent={onEvent} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    view.rerender(<DocumentApprovalCard documentId="doc-2" apiBaseUrl="http://api" onEvent={onEvent} />)
    await screen.findByText('Documento nuevo')

    await act(async () => releaseOldApproval(response(200, { ...pending, status: 'APPROVED', version: '2' })))
    expect(screen.getByText('Documento nuevo')).toBeInTheDocument()
    expect(screen.getByTestId('document-status')).toHaveTextContent('Pendiente')
    expect(onEvent).not.toHaveBeenCalled()
  })

  it('does not refresh the old document after a late network failure', async () => {
    let rejectOldApproval!: (reason: unknown) => void
    const oldApproval = new Promise<Response>((_, reject) => { rejectOldApproval = reject })
    const secondDocument = { ...pending, id: 'doc-2', title: 'Documento vigente' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(200, pending))
      .mockReturnValueOnce(oldApproval)
      .mockResolvedValueOnce(response(200, secondDocument))
    vi.stubGlobal('fetch', fetchMock)
    const onEvent = vi.fn()

    const view = render(<DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" onEvent={onEvent} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    view.rerender(<DocumentApprovalCard documentId="doc-2" apiBaseUrl="http://api" onEvent={onEvent} />)
    await screen.findByText('Documento vigente')

    await act(async () => rejectOldApproval(new TypeError('late timeout')))
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(screen.getByText('Documento vigente')).toBeInTheDocument()
    expect(onEvent).not.toHaveBeenCalled()
  })

  it('keeps two exported card instances isolated', async () => {
    const secondDocument = { ...pending, id: 'doc-2', title: 'Segundo documento' }
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(
      response(200, url.endsWith('/doc-2') ? secondDocument : pending),
    )))

    render(<>
      <DocumentApprovalCard documentId="doc-1" apiBaseUrl="http://api" />
      <DocumentApprovalCard documentId="doc-2" apiBaseUrl="http://api" />
    </>)

    expect(await screen.findByText('Documento')).toBeInTheDocument()
    expect(await screen.findByText('Segundo documento')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Aprobar' })).toHaveLength(2)
  })
})

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  })
}
