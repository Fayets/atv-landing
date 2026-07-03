import { useState } from 'react'
import styles from './AccessCodePage.module.css'

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
          Esta es tu clave de acceso personal e intransferible.
          Guardala ahora — la vas a necesitar para ingresar al contenido.
        </p>

        <div className={styles.codeWrap}>
          <span className={styles.codeLabel}>TU CLAVE DE ACCESO</span>
          <div className={styles.code}>{code}</div>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ COPIADO' : 'COPIAR CLAVE'}
          </button>
        </div>

        <div className={styles.warning}>
          <span className={styles.warningIcon}>⚠</span>
          <p>Esta clave es única y personal. No la compartás — cada acceso es individual y será verificado.</p>
        </div>

        <p className={styles.next}>
          Vas a recibir un email con el link de acceso y los detalles del webinar.
        </p>
      </div>
    </div>
  )
}
