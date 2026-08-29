export type DocumentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'INVALIDATED'

export interface DocumentSnapshot {
  id: string
  title: string
  status: DocumentStatus
  version: string
  updatedAt: string
}

export interface ProblemResponse {
  type: string
  title: string
  status: number
  detail: string
  code: string
  requestId: string | null
  currentDocument: DocumentSnapshot | null
}

export type ApprovalEvent =
  | { type: 'approved'; document: DocumentSnapshot }
  | { type: 'conflict'; code: string; document: DocumentSnapshot }
  | { type: 'outcome-unknown' }
