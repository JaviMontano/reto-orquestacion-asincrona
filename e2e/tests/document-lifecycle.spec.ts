import { expect, test, type Page } from '@playwright/test'

const documentId = '00000000-0000-0000-0000-000000000001'
const apiBase = 'http://host.docker.internal:8080'
const documentUrl = `${apiBase}/api/documents/${documentId}`

test.beforeEach(async ({ request }) => {
  await expect.poll(async () => (await request.get(documentUrl)).status()).toBe(200)
  const reset = await request.post(`${apiBase}/api/test/documents/${documentId}/reset`)
  expect(reset.status()).toBe(200)
  expect(reset.headers().etag).toBe('"v1"')
})

test('aprobación optimista confirma, persiste tras recarga y puede restablecerse', async ({ page, request }) => {
  const browserEvidence = observeBrowser(page)
  let releaseApproval!: () => void
  let markBackendCommitted!: () => void
  const approvalHeld = new Promise<void>((resolve) => { releaseApproval = resolve })
  const backendCommitted = new Promise<void>((resolve) => { markBackendCommitted = resolve })

  // Se retiene solo la respuesta al navegador: el backend ya confirmó y la UI continúa en estado optimista.
  await page.route(`**/api/documents/${documentId}/approve`, async (route) => {
    const response = await route.fetch()
    expect(response.status()).toBe(200)
    expect(response.headers().etag).toBe('"v2"')
    markBackendCommitted()
    await approvalHeld
    await route.fulfill({ response })
  })

  await page.goto('/')
  await expect(page.getByTestId('document-status')).toHaveText('Pendiente de aprobación')

  const approvalResponse = page.waitForResponse((response) => response.url().endsWith(`/documents/${documentId}/approve`))
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click()
  await backendCommitted

  await expect(page.getByTestId('document-status')).toHaveText('Aprobado')
  await expect(page.getByRole('button', { name: 'Aprobar', exact: true })).toBeDisabled()
  releaseApproval()

  expect((await approvalResponse).status()).toBe(200)
  await expect(page.getByTestId('document-version')).toHaveText('v2')
  await expect(page.getByRole('status')).toContainText('Documento aprobado')

  const persistedApproval = await request.get(documentUrl)
  expect(persistedApproval.headers().etag).toBe('"v2"')
  expect(await persistedApproval.json()).toMatchObject({ status: 'APPROVED', version: '2' })

  await page.reload()
  await expect(page.getByTestId('document-status')).toHaveText('Aprobado')
  await expect(page.getByTestId('document-version')).toHaveText('v2')

  const resetResponse = page.waitForResponse((response) => response.url().endsWith(`/documents/${documentId}/reset`))
  await page.getByRole('button', { name: 'Restablecer' }).click()
  expect((await resetResponse).status()).toBe(200)
  await expect(page.getByTestId('document-status')).toHaveText('Pendiente de aprobación')
  await expect(page.getByTestId('document-version')).toHaveText('v1')

  const persistedReset = await request.get(documentUrl)
  expect(persistedReset.headers().etag).toBe('"v1"')
  expect(await persistedReset.json()).toMatchObject({ status: 'PENDING_APPROVAL', version: '1' })
  browserEvidence.expectClean()
})

test('S2 confirma aprobación, invalida en PostgreSQL y reconcilia la UI', async ({ page, request }) => {
  const browserEvidence = observeBrowser(page)
  await page.goto('/')
  await expect(page.getByTestId('document-status')).toHaveText('Pendiente de aprobación')

  const approvalResponse = page.waitForResponse((response) => response.url().endsWith(`/documents/${documentId}/approve`))
  await page.getByRole('button', { name: 'Aprobar', exact: true }).click()
  const approved = await approvalResponse
  expect(approved.status()).toBe(200)
  expect(approved.headers().etag).toBe('"v2"')
  await expect(page.getByTestId('document-status')).toHaveText('Aprobado')
  await expect(page.getByTestId('document-version')).toHaveText('v2')

  const curricularUpdate = await request.post(`${apiBase}/api/test/documents/${documentId}/curricular-update`, {
    headers: { 'X-Request-Id': '22222222-2222-4222-8222-222222222222' },
  })
  expect(curricularUpdate.status()).toBe(200)
  expect(curricularUpdate.headers().etag).toBe('"v3"')
  expect(await curricularUpdate.json()).toMatchObject({ status: 'INVALIDATED', version: '3' })

  const refreshResponse = page.waitForResponse((response) => response.url() === documentUrl)
  await page.getByRole('button', { name: 'Consultar servidor' }).click()
  expect((await refreshResponse).status()).toBe(200)
  await expect(page.getByTestId('document-status')).toHaveText('Invalidado')
  await expect(page.getByTestId('document-version')).toHaveText('v3')

  const persisted = await request.get(documentUrl)
  expect(persisted.headers().etag).toBe('"v3"')
  expect(await persisted.json()).toMatchObject({ status: 'INVALIDATED', version: '3' })
  browserEvidence.expectClean()
})

function observeBrowser(page: Page) {
  const consoleErrors: string[] = []
  const apiRequests: string[] = []
  const failedRequests: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiRequests.push(request.url())
  })
  page.on('requestfailed', (request) => {
    if (request.url().includes('/api/')) {
      failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`)
    }
  })

  return {
    expectClean() {
      expect(apiRequests.length).toBeGreaterThan(0)
      expect(apiRequests.every((url) => url.startsWith(apiBase))).toBeTruthy()
      expect(failedRequests).toEqual([])
      expect(consoleErrors).toEqual([])
    },
  }
}
