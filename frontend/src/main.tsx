import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DocumentApprovalCard } from './DocumentApprovalCard'
import './page.css'

const documentId = '00000000-0000-0000-0000-000000000001'
const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8080`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <section className="intro">
        <span>Java 21 · React · PostgreSQL</span>
        <h2>Carrera determinista, estado íntegro</h2>
        <p>Prueba la aprobación normal o fuerza que una actualización curricular confirme primero.</p>
      </section>
      <DocumentApprovalCard documentId={documentId} apiBaseUrl={apiBaseUrl} enableDemoControls />
    </main>
  </StrictMode>,
)
