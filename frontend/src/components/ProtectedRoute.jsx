import { useEffect, useState } from 'react'
import { getSession } from '../api/auth'
import '../styles/atv-dashboard.css'

const LOGO_SRC = `${import.meta.env.BASE_URL}AumentaTuValorLogo.png`

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setStatus('authenticated')
      } else {
        window.location.replace('https://ecosystem.atvos.io')
      }
    })
  }, [])

  if (status === 'loading') {
    return (
      <div className="atv-metrics-page atv-metrics-page--loading">
        <div className="atv-page__glow atv-page__glow--metrics" aria-hidden="true" />
        <img
          src={LOGO_SRC}
          alt="Aumenta Tu Valor"
          className="atv-metrics-loading-logo"
          width={112}
          height={36}
        />
        <span className="atv-metrics-spinner" aria-hidden="true" />
      </div>
    )
  }

  return children
}
