import { useState } from 'react'
import { submitLead } from '../api/leads'
import PhoneInput from '../components/PhoneInput'
import styles from './LandingPage.module.css'

export default function LandingPage({ onComplete }) {
  const [step, setStep] = useState('form')
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Completá todos los campos para continuar.')
      return
    }
    setError(null)
    setStep('loading')
    try {
      const result = await submitLead(form)
      onComplete({ ...form, access_code: result.access_code, id: result.id })
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
      setStep('form')
    }
  }

  if (step === 'loading') {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Generando tu acceso exclusivo...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.halo} aria-hidden="true" />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.badge}>WEBINAR EXCLUSIVO · CUPOS LIMITADOS</span>

          <h1 className={styles.headline}>
            El sistema que usan los vendedores que{' '}
            <span className={styles.accent}>cierran el 80%</span>{' '}
            de sus llamadas
          </h1>

          <p className={styles.sub}>
            Accedé gratis al entrenamiento y recibí tu clave de acceso personalizada.
          </p>

          {/* FORM */}
          <div className={styles.formCard}>
            <p className={styles.formTitle}>QUIERO MI LUGAR</p>
            <input
              className={styles.input}
              type="text"
              name="name"
              placeholder="Tu nombre completo"
              value={form.name}
              onChange={handleChange}
            />
            <input
              className={styles.input}
              type="email"
              name="email"
              placeholder="Tu email"
              value={form.email}
              onChange={handleChange}
            />
            <PhoneInput
              value={form.phone}
              onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
              placeholder="Tu número de WhatsApp"
            />
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.cta} onClick={handleSubmit}>
              QUIERO MI ACCESO GRATUITO →
            </button>
            <p className={styles.disclaimer}>
              Sin spam. Tu información es 100% segura.
            </p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className={styles.social}>
        <p className={styles.socialTitle}>RESULTADOS DE QUIENES YA APLICARON EL MÉTODO</p>
        <div className={styles.socialGrid}>
          <div className={styles.caseCard}>
            <p className={styles.caseText}>"Pasé de cerrar 2 de cada 10 a cerrar 8. En 30 días."</p>
            <span className={styles.caseName}>— Martín R., consultor</span>
          </div>
          <div className={styles.caseCard}>
            <p className={styles.caseText}>"Nunca pensé que el problema era mi estructura de llamada. Ahora lo veo clarísimo."</p>
            <span className={styles.caseName}>— Carolina V., coach</span>
          </div>
          <div className={styles.caseCard}>
            <p className={styles.caseText}>"Apliqué lo del webinar al día siguiente y cerré una venta de $3.000 USD."</p>
            <span className={styles.caseName}>— Diego M., agencia</span>
          </div>
        </div>
      </section>
    </div>
  )
}
