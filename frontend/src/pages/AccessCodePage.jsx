import { useEffect, useState } from 'react'
import { buildWhatsappUrl } from '../utils/buildWhatsappMessage'
import styles from './AccessCodePage.module.css'

export default function AccessCodePage({ data, calificado }) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const code = data?.access_code || '---'
  const name = data?.name || ''
  const waUrl = buildWhatsappUrl(data || {})

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = waUrl
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, waUrl])

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

        <div className={styles.nextStep}>
          <span className={styles.nextLabel}>SIGUIENTE PASO</span>
          <a href={waUrl} className={styles.nextLink}>
            Acceder al contenido →
          </a>
        </div>

        <div className={styles.countdown}>
          <div className={styles.countdownCircle}>
            <span className={styles.countdownNum}>{countdown}</span>
          </div>
          <p className={styles.countdownText}>
            Te redirigimos a WhatsApp en {countdown} segundos para confirmar tu acceso.
          </p>
          <a href={waUrl} className={styles.waBtn}>
            🟢 Ir a WhatsApp ahora
          </a>
        </div>

        <div className={styles.warning}>
          <span className={styles.warningIcon}>⚠</span>
          <p>Esta clave es única y personal. No la compartás.</p>
        </div>
      </div>
    </div>
  )
}
