import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ContentProvider } from './content/ContentContext.jsx'

/**
 * El panel se carga aparte (lazy) para que ni un byte de su código viaje a
 * los visitantes del sitio público.
 */
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

const esAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

function Cargando() {
  return (
    <div className="grid min-h-svh place-items-center bg-shell">
      <p className="text-sm font-semibold text-muted">Cargando panel…</p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {esAdmin ? (
      <Suspense fallback={<Cargando />}>
        <AdminApp />
      </Suspense>
    ) : (
      <ContentProvider>
        <App />
      </ContentProvider>
    )}
  </StrictMode>
)
