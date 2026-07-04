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
          <span className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            ACCESO GRATUITO
            <span className={styles.badgeSep} aria-hidden="true">·</span>
            CLAVE PERSONAL DE ACCESO
          </span>

          <h1 className={styles.headline}>
            Escalé a +$170k/mes únicamente en orgánico
            <br />
            subiendo <span className={styles.accent}>6 piezas de contenido al mes.</span>
            <br />
            Te muestro el sistema que me lo permitió.
          </h1>

          <p className={styles.sub}>
            Lo que estás por ver me costó años, mucho dinero y errores que no tenés que repetir.
            Completá tus datos y accedé gratis — tu clave es única, intransferible y tiene cupos limitados.
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
    </div>
  )
}
