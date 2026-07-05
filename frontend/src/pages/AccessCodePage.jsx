import { useEffect, useMemo, useState } from 'react'
import { buildAccessWhatsappUrl } from '../utils/buildWhatsappMessage'
import styles from './AccessCodePage.module.css'

const COUNTDOWN_SECONDS = 10

export default function AccessCodePage({ data }) {
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const code = data?.access_code || '---'
  const name = data?.name || ''
  const waUrl = useMemo(() => buildAccessWhatsappUrl(data), [data])

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.href = waUrl
      return undefined
    }
    const timer = window.setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, waUrl])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGoNow = () => {
    window.location.href = waUrl
  }

  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100

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

        <div className={styles.waRedirect}>
          <span className={styles.waEyebrow}>Siguiente paso</span>
          <div className={styles.timerWrap} aria-live="polite">
            <svg className={styles.timerRing} viewBox="0 0 44 44" aria-hidden="true">
              <circle className={styles.timerTrack} cx="22" cy="22" r="18" />
              <circle
                className={styles.timerProgress}
                cx="22"
                cy="22"
                r="18"
                style={{ strokeDashoffset: `${113 - (113 * progress) / 100}` }}
              />
            </svg>
            <span className={styles.timerValue}>{secondsLeft > 0 ? secondsLeft : '…'}</span>
          </div>
          <p className={styles.waText}>
            {secondsLeft > 0
              ? `Te redirigimos a WhatsApp en ${secondsLeft} segundo${secondsLeft === 1 ? '' : 's'} para confirmar tu acceso.`
              : 'Abriendo WhatsApp...'}
          </p>
          <button type="button" className={styles.waBtn} onClick={handleGoNow}>
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            Ir a WhatsApp ahora
          </button>
        </div>
      </div>
    </div>
  )
}
