import { useEffect, useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import AccessCodePage from './pages/AccessCodePage'
import ProtectedRoute from './components/ProtectedRoute'

const LEAD_STORAGE_KEY = 'atv_lead'

function readStoredLead() {
  try {
    const stored = sessionStorage.getItem(LEAD_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

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

  const handleComplete = (data) => {
    sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data))
    setLeadData(data)
    window.history.pushState({}, '', '/acceso')
    setPath('/acceso')
  }

  if (path === '/acceso') {
    return <AccessCodePage data={leadData} />
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
