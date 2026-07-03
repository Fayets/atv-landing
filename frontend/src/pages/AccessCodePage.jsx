import { useState } from 'react'
import { regenerarCodigo } from '../api/leads'
import styles from './AccessCodePage.module.css'

export default function AccessCodePage({ data, onCodeUpdate }) {
  const [code, setCode] = useState(data?.access_code || '---')
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const name = data?.name || ''

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerarClick = () => {
    setConfirming(true)
  }

  const handleConfirmar = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await regenerarCodigo(data.id)
      setCode(result.access_code)
      if (onCodeUpdate) onCodeUpdate(result.access_code)
      setConfirming(false)
    } catch {
      setError('No se pudo regenerar la clave. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    setConfirming(false)
    setError(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>ACCESO CONFIRMADO</span>
        <h1 className={styles.title}>
          {name ? `${name.split(' ')[0]}, ya sos parte.` : 'Ya sos parte.'}
        </h1>
        <p className={styles.sub}>
          Esta es tu clave de acceso personal e intransferible al webinar.
          Guardala ahora — la vas a necesitar para ingresar.
        </p>

        <div className={styles.codeWrap}>
          <span className={styles.codeLabel}>TU CLAVE DE ACCESO</span>
          <div className={styles.code}>{code}</div>

          <div className={styles.actions}>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? '✓ COPIADO' : 'COPIAR CLAVE'}
            </button>
            <button
              className={styles.regenBtn}
              onClick={handleRegenerarClick}
              disabled={loading || confirming}
            >
              ↺ CAMBIAR CLAVE
            </button>
          </div>

          {confirming && (
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>
                ¿Seguro? Tu clave anterior quedará inválida.
              </p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.confirmBtn}
                  onClick={handleConfirmar}
                  disabled={loading}
                >
                  {loading ? 'GENERANDO...' : 'SÍ, CAMBIAR'}
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={handleCancelar}
                  disabled={loading}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
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
