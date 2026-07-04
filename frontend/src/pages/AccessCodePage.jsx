import { useState } from 'react'
import styles from './AccessCodePage.module.css'

const WEBINAR_URL = import.meta.env.VITE_WEBINAR_URL || 'https://webinar.atvos.io'

export default function AccessCodePage({ data }) {
  const [copied, setCopied] = useState(false)
  const code = data?.access_code || '---'
  const name = data?.name || ''

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.card}>
        <span className={styles.badge}>ACCESO CONFIRMADO</span>
        <h1 className={styles.title}>
          {name ? `${name.split(' ')[0]}, ya sos parte.` : 'Ya sos parte.'}
        </h1>
        <p className={styles.sub}>
          Copiá y guardá tu clave — es personal e intransferible, y la vas a necesitar para ingresar al contenido.
        </p>

        <div className={styles.codeWrap}>
          <span className={styles.codeLabel}>TU CLAVE DE ACCESO</span>
          <div className={styles.code}>{code}</div>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ COPIADO' : 'COPIAR CLAVE'}
          </button>
        </div>

        <a className={styles.accederBtn} href={WEBINAR_URL}>
          <span className={styles.accederEyebrow}>Siguiente paso</span>
          <span className={styles.accederMain}>
            Acceder al contenido
            <svg className={styles.accederIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  )
}
