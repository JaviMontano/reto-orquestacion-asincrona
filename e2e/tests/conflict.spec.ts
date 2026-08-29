import { expect, test } from '@playwright/test'

const documentId = '00000000-0000-0000-0000-000000000001'
const apiBase = 'http://host.docker.internal:8080'

test('S1 revierte el optimismo y converge al documento invalidado', async ({ page, request }) => {
  await expect.poll(async () => (await request.get(`${apiBase}/api/documents/${documentId}`)).status()).toBe(200)
  await request.post(`${apiBase}/api/test/documents/${documentId}/reset`)

  const consoleErrors: string[] = []
  const apiRequests: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('request', (networkRequest) => {
    if (networkRequest.url().includes('/api/')) apiRequests.push(networkRequest.url())
  })
  page.on('requestfailed', (networkRequest) => {
    if (networkRequest.url().includes('/api/')) {
      failedRequests.push(`${networkRequest.url()}: ${networkRequest.failure()?.errorText}`)
    }
  })

  await page.goto('/')
  await expect(page.getByTestId('document-status')).toHaveText('Pendiente de aprobación')
  const approvalResponse = page.waitForResponse((response) => response.url().endsWith(`/documents/${documentId}/approve`))
  await page.getByRole('button', { name: 'Aprobar con conflicto' }).click()

  expect((await approvalResponse).status(), failedRequests.join('\n')).toBe(412)

  await expect(page.getByTestId('document-status')).toHaveText('Invalidado')
  await expect(page.getByTestId('document-version')).toHaveText('v2')
  await expect(page.getByRole('status')).toContainText('STALE_VERSION')

  const persisted = await request.get(`${apiBase}/api/documents/${documentId}`)
  expect(await persisted.json()).toMatchObject({ status: 'INVALIDATED', version: '2' })
  expect(apiRequests.every((url) => url.startsWith(apiBase))).toBeTruthy()
  // Chromium reports handled 4xx responses as resource errors; the 412 is asserted above.
  const unexpectedConsoleErrors = consoleErrors.filter((message) => !message.includes('status of 412'))
  expect(unexpectedConsoleErrors).toEqual([])
})
