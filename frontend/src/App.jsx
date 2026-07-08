import { useEffect, useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import AccessCodePage from './pages/AccessCodePage'
import ProtectedRoute from './components/ProtectedRoute'
import { esCalificado } from './utils/calificacion'
import {
  isValidLead,
  readStoredLead,
  saveLead,
} from './utils/leadSession'

const BASE = '/acceso'

function stripBase(path) {
  const p = path.startsWith(BASE) ? path.slice(BASE.length) : path
  return p === '' ? '/' : p
}

const PAGE_TITLES = {
  '/': 'ATV',
  '/acceso': 'ATV - Thanks you Page',
  '/dashboard': 'ATV - Dashboard',
}

export default function App() {
  const [path, setPath] = useState(() => stripBase(window.location.pathname))
  const [leadData, setLeadData] = useState(() => (
    stripBase(window.location.pathname) === '/acceso' ? readStoredLead() : null
  ))

  useEffect(() => {
    const syncPath = () => setPath(stripBase(window.location.pathname))
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    document.title = PAGE_TITLES[path] || PAGE_TITLES['/']
  }, [path])

  useEffect(() => {
    if (path !== '/acceso') return

    const stored = readStoredLead()
    if (isValidLead(stored)) {
      setLeadData(stored)
      return
    }

    setLeadData(null)
    window.history.replaceState({}, '', BASE)
    setPath('/')
  }, [path])

  const handleComplete = (data) => {
    const calificado = esCalificado(data)
    const payload = { ...data, calificado }
    saveLead(payload)
    setLeadData(payload)
    window.history.pushState({}, '', `${BASE}/acceso`)
    setPath('/acceso')
  }

  if (path === '/acceso') {
    if (!isValidLead(leadData)) return null
    return <AccessCodePage data={leadData} calificado={leadData.calificado} />
  }
  if (path === '/dashboard') {
    return (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  }
  if (path === '/') {
    return <LandingPage onComplete={handleComplete} />
  }
  window.location.replace(BASE)
  return null
}
