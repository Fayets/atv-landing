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

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [leadData, setLeadData] = useState(() => (
    window.location.pathname === '/acceso' ? readStoredLead() : null
  ))

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname)
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    if (path !== '/acceso') return

    const stored = readStoredLead()
    if (isValidLead(stored)) {
      setLeadData(stored)
      return
    }

    setLeadData(null)
    window.history.replaceState({}, '', '/')
    setPath('/')
  }, [path])

  const handleComplete = (data) => {
    const calificado = esCalificado(data)
    const payload = { ...data, calificado }
    saveLead(payload)
    setLeadData(payload)
    window.history.pushState({}, '', '/acceso')
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
  window.location.replace('/')
  return null
}
