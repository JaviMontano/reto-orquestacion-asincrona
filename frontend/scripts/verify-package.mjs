import { access } from 'node:fs/promises'

await Promise.all([
  access('dist-lib/public-api.d.ts'),
  access('dist-lib/document-approval-mfe.css'),
])

const publicApi = await import('../dist-lib/document-approval-mfe.js')
if (typeof publicApi.DocumentApprovalCard !== 'function') {
  throw new Error('DocumentApprovalCard is missing from the built public API')
}

console.info('PACKAGE_CONSUMER_OK')
