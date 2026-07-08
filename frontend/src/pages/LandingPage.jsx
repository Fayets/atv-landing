import { useEffect, useRef, useState } from 'react'
import { submitLead, updateLead, sendCapiEvent } from '../api/leads'
import PhoneInput from '../components/PhoneInput'
import {
  AREA_TO_ANSWER_KEY,
  BOTTLENECK_AREAS,
  BOTTLENECK_SUB_OPTS,
  buildQuizUpdatePayload,
  INITIAL_ANSWERS,
  isBottleneckValid,
  QUIZ_STEPS,
} from '../data/landingQuiz'
import { esCalificado } from '../utils/calificacion'
import CosmicBackground from '../components/CosmicBackground'
import styles from './LandingPage.module.css'

const INITIAL_CUPOS = 52
const MIN_CUPOS = 9
const CUPOS_TICK_MS = 25000

export default function LandingPage({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(INITIAL_ANSWERS)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [leadId, setLeadId] = useState(null)
  const [accessCode, setAccessCode] = useState(null)
  const leadIdRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cuposRestantes, setCuposRestantes] = useState(INITIAL_CUPOS)
  const [cuposPulse, setCuposPulse] = useState(false)

  useEffect(() => {
    leadIdRef.current = leadId
  }, [leadId])

  useEffect(() => {
    const interval = setInterval(() => {
      setCuposRestantes((prev) => {
        if (prev <= MIN_CUPOS) return prev
        return prev - 1
      })
    }, CUPOS_TICK_MS)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (cuposRestantes === INITIAL_CUPOS) return undefined

    setCuposPulse(true)
    const timeout = setTimeout(() => setCuposPulse(false), 700)
    return () => clearTimeout(timeout)
  }, [cuposRestantes])

  const step = QUIZ_STEPS[current]
  const isLast = current === QUIZ_STEPS.length - 1
  const progress = ((current + 1) / QUIZ_STEPS.length) * 100

  const canNext = (() => {
    if (step.type === 'form') {
      return form.name.trim() && form.email.trim() && form.phone.trim()
    }
    if (step.type === 'options') return !!answers[step.id]
    if (step.type === 'bottleneck') return isBottleneckValid(answers)
    return false
  })()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleOption = (opt) => {
    setAnswers((prev) => ({ ...prev, [step.id]: opt }))
  }

  const toggleArea = (area) => {
    const key = AREA_TO_ANSWER_KEY[area]
    setAnswers((prev) => {
      const isSelected = prev.bottleneckAreas.includes(area)
      return {
        ...prev,
        bottleneckAreas: isSelected
          ? prev.bottleneckAreas.filter((a) => a !== area)
          : [...prev.bottleneckAreas, area],
        [key]: isSelected ? [] : prev[key],
      }
    })
  }

  const toggleSubOption = (area, opt) => {
    const key = AREA_TO_ANSWER_KEY[area]
    setAnswers((prev) => {
      const currentOpts = prev[key]
      return {
        ...prev,
        [key]: currentOpts.includes(opt)
          ? currentOpts.filter((o) => o !== opt)
          : [...currentOpts, opt],
      }
    })
  }

  const handleNext = async () => {
    if (step.type === 'form') {
      setError(null)
      try {
        const res = await submitLead({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        })
        if (res?.id) {
          setLeadId(res.id)
          leadIdRef.current = res.id
        }
        if (res?.access_code) setAccessCode(res.access_code)
        if (res?.id) {
          const leadEventId = `lead_${res.id}_${Date.now()}`

          if (typeof window.fbq !== 'undefined') {
            window.fbq('track', 'Lead', {
              content_name: 'webinar_registro',
            }, {
              eventID: leadEventId,
            })
          }

          await sendCapiEvent(res.id, {
            event_name: 'Lead',
            event_id: leadEventId,
            email: form.email,
            phone: form.phone,
          })
        }
      } catch (e) {
        console.error('Error al guardar contacto:', e)
      }
      setCurrent((c) => c + 1)
      return
    }

    if (isLast) {
      setLoading(true)
      setError(null)
      try {
        let waitedId = leadId
        if (!waitedId) {
          const maxWaitMs = 5000
          const stepMs = 150
          let waited = 0
          while (!waitedId && waited < maxWaitMs) {
            await new Promise((r) => setTimeout(r, stepMs))
            waited += stepMs
            waitedId = leadIdRef.current
          }
        }

        if (!waitedId) {
          throw new Error('No se pudo vincular tu registro. Probá completar el formulario de nuevo.')
        }

        await updateLead(waitedId, buildQuizUpdatePayload(answers))

        const payload = {
          ...form,
          id: waitedId,
          access_code: accessCode,
          avatar: answers.avatar,
          revenue: answers.revenue,
          bottleneck_marketing: answers.bottleneckMarketing,
          bottleneck_ventas: answers.bottleneckVentas,
          bottleneck_producto: answers.bottleneckProducto,
        }

        const calificado = esCalificado(payload)

        await updateLead(waitedId, { calificado })

        if (esCalificado(payload)) {
          const calEventId = `cal_${waitedId}_${Date.now()}`

          if (typeof window.fbq !== 'undefined') {
            window.fbq('track', 'SubmitApplication', {
              content_name: 'webinar_calificado',
            }, {
              eventID: calEventId,
            })
          }

          await sendCapiEvent(waitedId, {
            event_name: 'SubmitApplication',
            event_id: calEventId,
            email: form.email,
            phone: form.phone,
          })
        }

        onComplete({
          ...form,
          id: waitedId,
          access_code: accessCode,
          avatar: answers.avatar,
          bottleneck_areas: answers.bottleneckAreas,
          bottleneck_marketing: answers.bottleneckMarketing,
          bottleneck_ventas: answers.bottleneckVentas,
          bottleneck_producto: answers.bottleneckProducto,
          revenue: answers.revenue,
        })
      } catch (e) {
        setError(e.message || 'Ocurrió un error. Intentá de nuevo.')
        setLoading(false)
      }
      return
    }

    setCurrent((c) => c + 1)
  }

  const selectedAreas = BOTTLENECK_AREAS.filter((area) =>
    answers.bottleneckAreas.includes(area),
  )

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <CosmicBackground />
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Generando tu acceso exclusivo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <CosmicBackground />

      {current === 0 && (
        <div className={styles.showcase} aria-hidden="true">
          <img
            className={`${styles.showcaseImg} ${styles.showcaseCharts}`}
            src={`${import.meta.env.BASE_URL}landing-charts.png`}
            alt=""
          />
          <img
            className={`${styles.showcaseImg} ${styles.showcaseProcess}`}
            src={`${import.meta.env.BASE_URL}landing-process.png`}
            alt=""
          />
          <img
            className={`${styles.showcaseImg} ${styles.showcaseFunnel}`}
            src={`${import.meta.env.BASE_URL}landing-funnel.png`}
            alt=""
          />
          <img
            className={`${styles.showcaseImg} ${styles.showcaseFlows}`}
            src={`${import.meta.env.BASE_URL}landing-flows.png`}
            alt=""
          />
          <img
            className={`${styles.showcaseImg} ${styles.showcaseFlywheel}`}
            src={`${import.meta.env.BASE_URL}landing-flywheel.png`}
            alt=""
          />
          <img
            className={`${styles.showcaseImg} ${styles.showcaseFunnelFull}`}
            src={`${import.meta.env.BASE_URL}landing-funnel-full.png`}
            alt=""
          />
        </div>
      )}

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            ACCESO PRIVADO
          </span>

          <h1 className={styles.headline}>
            Escalé a +$170k/mes en orgánico,{' '}
            <span className={styles.accent}>sin ads y 6 piezas de contenido.</span>
            <span className={styles.headlineSecondary}>
              Te muestro el método que me lo permitió y cómo replicarlo.
            </span>
          </h1>

          <div className={styles.subWrap}>
            <p className={styles.sub}>Completá tus datos y accede gratis hoy.</p>
            <span className={`${styles.cuposBadge} ${cuposPulse ? styles.cuposBadgePulse : ''}`}>
              <span className={styles.cuposBadgeInner}>
                Quedan{' '}
                <span className={styles.cuposNumber} key={cuposRestantes}>
                  {cuposRestantes}
                </span>
                {' '}accesos disponibles
              </span>
            </span>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              {step.type === 'form' && (
                <p className={styles.formTitle}>{step.title}</p>
              )}
              {step.type !== 'form' && (
                <>
                  <p className={styles.stepLabel}>
                    Pregunta {current + 1} de {QUIZ_STEPS.length}
                  </p>
                  <p className={styles.question}>{step.question}</p>
                </>
              )}
            </div>

            <div className={styles.progressWrap} aria-hidden="true">
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>

            <div className={styles.formBody}>
              {step.type === 'form' && (
                <>
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
                </>
              )}

              {step.type === 'options' && (
                <div className={styles.options}>
                  {step.opts.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`${styles.opt} ${answers[step.id] === opt ? styles.optSelected : ''}`}
                      onClick={() => handleOption(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {step.type === 'bottleneck' && (
                <div className={styles.bottleneck}>
                  <div className={styles.checkGroup}>
                    {BOTTLENECK_AREAS.map((area) => (
                      <label
                        key={area}
                        className={`${styles.checkOpt} ${answers.bottleneckAreas.includes(area) ? styles.checkSelected : ''}`}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkInput}
                          checked={answers.bottleneckAreas.includes(area)}
                          onChange={() => toggleArea(area)}
                        />
                        <span className={styles.checkBox} />
                        <span>{area}</span>
                      </label>
                    ))}
                  </div>

                  {selectedAreas.map((area) => {
                    const answerKey = AREA_TO_ANSWER_KEY[area]
                    return (
                      <div key={area} className={styles.subBlock}>
                        <div className={styles.subBlockTitle}>{area}</div>
                        <div className={styles.checkGroup}>
                          {BOTTLENECK_SUB_OPTS[area].map((opt) => (
                            <label
                              key={opt}
                              className={`${styles.checkOpt} ${answers[answerKey].includes(opt) ? styles.checkSelected : ''}`}
                            >
                              <input
                                type="checkbox"
                                className={styles.checkInput}
                                checked={answers[answerKey].includes(opt)}
                                onChange={() => toggleSubOption(area, opt)}
                              />
                              <span className={styles.checkBox} />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.formFooter}>
              {current > 0 ? (
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setCurrent((c) => c - 1)}
                >
                  ← Atrás
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                className={styles.cta}
                onClick={handleNext}
                disabled={!canNext}
              >
                {step.type === 'form'
                  ? 'QUIERO MI ACCESO →'
                  : isLast
                    ? 'OBTENER MI CLAVE →'
                    : 'CONTINUAR →'}
              </button>

              {step.type === 'form' && (
                <p className={styles.ctaNote}>
                  Luego de completar el formulario vas a obtener una clave única e intransferible.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
