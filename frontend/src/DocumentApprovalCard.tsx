import type { ApprovalEvent, DocumentStatus } from './model'
import styles from './DocumentApprovalCard.module.css'
import { useDocumentApproval } from './useDocumentApproval'

export interface DocumentApprovalCardProps {
  documentId: string
  apiBaseUrl: string
  onEvent?: (event: ApprovalEvent) => void
  enableDemoControls?: boolean
}

const LABELS: Record<DocumentStatus, string> = {
  PENDING_APPROVAL: 'Pendiente de aprobación',
  APPROVED: 'Aprobado',
  INVALIDATED: 'Invalidado',
}

export function DocumentApprovalCard({
  documentId,
  apiBaseUrl,
  onEvent,
  enableDemoControls = false,
}: DocumentApprovalCardProps) {
  const { state, approve, refresh, reset } = useDocumentApproval({ documentId, apiBaseUrl, onEvent })
  const document = state.authoritative
  const visibleStatus = state.optimisticStatus ?? document?.status
  const isBusy = state.phase === 'approving'
  const canApprove = document?.status === 'PENDING_APPROVAL' && state.phase === 'stable'

  return (
    <article className={styles.card} aria-busy={isBusy}>
      <header>
        <p className={styles.eyebrow}>Validación humana</p>
        <h1>{document?.title ?? 'Cargando documento…'}</h1>
      </header>

      {document && (
        <dl className={styles.metadata}>
          <div><dt>Estado</dt><dd data-testid="document-status" className={styles[visibleStatus ?? 'PENDING_APPROVAL']}>{LABELS[visibleStatus ?? 'PENDING_APPROVAL']}</dd></div>
          <div><dt>Versión</dt><dd data-testid="document-version">v{document.version}</dd></div>
        </dl>
      )}

      <div className={styles.actions}>
        <button onClick={() => approve(false)} disabled={!canApprove}>Aprobar</button>
        {enableDemoControls && (
          <button className={styles.secondary} onClick={() => approve(true)} disabled={!canApprove}>
            Aprobar con conflicto
          </button>
        )}
      </div>

      {enableDemoControls && (
        <div className={styles.demoActions}>
          <button onClick={reset} disabled={isBusy}>Restablecer</button>
          <button onClick={refresh} disabled={isBusy}>Consultar servidor</button>
        </div>
      )}

      <p role="status" aria-live="polite" className={styles.message}>{state.message}</p>
    </article>
  )
}
