import type { DocumentSnapshot } from './model'
import { compareDecimalVersions } from './version'

export type Phase = 'loading' | 'stable' | 'approving' | 'outcomeUnknown'

export interface ApprovalState {
  authoritative: DocumentSnapshot | null
  optimisticStatus: 'APPROVED' | null
  pendingRequestId: string | null
  phase: Phase
  message: string
}

export type ApprovalAction =
  | { type: 'documentChanged' }
  | { type: 'loaded'; document: DocumentSnapshot }
  | { type: 'resetSucceeded'; document: DocumentSnapshot }
  | { type: 'approvalStarted'; requestId: string }
  | { type: 'approvalSucceeded'; requestId: string; document: DocumentSnapshot }
  | { type: 'conflict'; requestId: string; code: string; document: DocumentSnapshot }
  | { type: 'outcomeUnknown'; requestId: string }
  | { type: 'loadFailed' }

export const initialState: ApprovalState = {
  authoritative: null,
  optimisticStatus: null,
  pendingRequestId: null,
  phase: 'loading',
  message: '',
}

export function approvalReducer(state: ApprovalState, action: ApprovalAction): ApprovalState {
  switch (action.type) {
    case 'documentChanged':
      return initialState
    case 'loaded':
      return adoptSnapshot(state, action.document, 'stable', '')
    case 'resetSucceeded':
      // El reset local recrea deliberadamente el fixture en v1; no es una respuesta tardía.
      return replaceSnapshot(action.document)
    case 'approvalStarted':
      return {
        ...state,
        optimisticStatus: 'APPROVED',
        pendingRequestId: action.requestId,
        phase: 'approving',
        message: 'Aprobación pendiente de confirmación…',
      }
    case 'approvalSucceeded':
      if (state.pendingRequestId !== action.requestId) return state
      return adoptSnapshot(state, action.document, 'stable', 'Documento aprobado.')
    case 'conflict':
      if (state.pendingRequestId !== action.requestId) return state
      return adoptSnapshot(
        state,
        action.document,
        'stable',
        `Conflicto ${action.code}: se adoptó el estado vigente del servidor.`,
      )
    case 'outcomeUnknown':
      if (state.pendingRequestId !== action.requestId) return state
      return {
        ...state,
        optimisticStatus: null,
        pendingRequestId: null,
        phase: 'outcomeUnknown',
        message: 'Resultado incierto. Consulta el servidor antes de reintentar.',
      }
    case 'loadFailed':
      return { ...state, phase: 'outcomeUnknown', message: 'No fue posible consultar el estado autoritativo.' }
  }
}

function replaceSnapshot(document: DocumentSnapshot): ApprovalState {
  return {
    authoritative: document,
    optimisticStatus: null,
    pendingRequestId: null,
    phase: 'stable',
    message: '',
  }
}

function adoptSnapshot(
  state: ApprovalState,
  candidate: DocumentSnapshot,
  phase: Phase,
  message: string,
): ApprovalState {
  const current = state.authoritative
  if (current && current.id === candidate.id && compareDecimalVersions(candidate.version, current.version) < 0) {
    return state
  }
  return {
    authoritative: candidate,
    optimisticStatus: null,
    pendingRequestId: null,
    phase,
    message,
  }
}
