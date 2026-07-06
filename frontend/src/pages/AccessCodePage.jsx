import { useEffect, useState } from 'react'
import { buildWhatsappUrl } from '../utils/buildWhatsappMessage'
import styles from './AccessCodePage.module.css'

const COUNTDOWN_SECONDS = 10

export default function AccessCodePage({ data, calificado }) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const code = data?.access_code || '---'
  const name = data?.name || ''
  const waUrl = buildWhatsappUrl(data || {})
  const progress = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100

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
          Copia y guarda tu clave.
          <br />
          La vas a necesitar para ingresar al contenido.
        </p>

        <div className={styles.codeWrap}>
          <span className={styles.codeLabel}>TU CLAVE DE ACCESO</span>
          <div className={styles.code}>{code}</div>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ COPIADO' : 'COPIAR CLAVE'}
          </button>
        </div>

        <div className={styles.countdown}>
          <span className={styles.countdownLabel}>CONFIRMÁ TU ACCESO</span>

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
            <span className={styles.timerValue}>{countdown > 0 ? countdown : '…'}</span>
          </div>

          <p className={styles.countdownText}>
            {countdown > 0
              ? `Te redirigimos a WhatsApp en ${countdown} segundo${countdown === 1 ? '' : 's'} para confirmar tu acceso.`
              : 'Abriendo WhatsApp...'}
          </p>

          <a href={waUrl} className={styles.waBtn}>
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            Ir a WhatsApp ahora
          </a>
        </div>
      </div>
    </div>
  )
}
