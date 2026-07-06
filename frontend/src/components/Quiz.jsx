import { useState, useRef, useEffect } from 'react'
import styles from './Quiz.module.css'
import { submitLead, updateLead } from '../api/leads'
import {
  AREA_TO_ANSWER_KEY,
  BOTTLENECK_AREAS,
  BOTTLENECK_SUB_OPTS,
  buildQuizUpdatePayload,
  INITIAL_ANSWERS,
  isBottleneckValid,
} from '../data/landingQuiz'

const STEPS = [
  {
    id: 'contact',
    q: 'Dejame tus datos y te mando el diagnóstico de escalabilidad',
    type: 'form',
  },
  {
    id: 'avatar',
    q: '¿Cuál es tu perfil hoy?',
    type: 'options',
    opts: [
      'Creador de contenido',
      'Creador/infoproductos',
      'Experto en infoproductos / Growth Operator',
      'Dueño de negocio',
      'Dueño de agencia',
      'Habilidades de alto valor',
      'Otro',
    ],
  },
  {
    id: 'bottleneck',
    q: '¿Cuál es tu cuello de botella?',
    type: 'bottleneck',
  },
  {
    id: 'revenue',
    q: '¿Cuánto facturas por mes hoy?',
    type: 'options',
    opts: ['$1k a $5k', '$5k a $10k', '$10k a $30k', '$30k a $50k', '+$50k'],
  },
]

function buildPayload(answers, form) {
  return {
    ...buildQuizUpdatePayload(answers),
    name: form.name,
    email: form.email,
    phone: form.phone,
  }
}

export default function Quiz({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(INITIAL_ANSWERS)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [leadId, setLeadId] = useState(null)
  const leadIdRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    leadIdRef.current = leadId
  }, [leadId])

  const step = STEPS[current]
  const progress = ((current + 1) / STEPS.length) * 100
  const isLast = current === STEPS.length - 1

  const canNext = (() => {
    if (step.type === 'options') return !!answers[step.id]
    if (step.type === 'bottleneck') return isBottleneckValid(answers)
    if (step.type === 'form') return form.name && form.email && form.phone
    return false
  })()

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
      try {
        const res = await submitLead({
          name: form.name,
          email: form.email,
          phone: form.phone,
        })
        if (res?.id) {
          setLeadId(res.id)
          leadIdRef.current = res.id
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
        const payload = buildPayload(answers, form)

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
          throw new Error('No se pudo vincular tu información de contacto. Probá completar el formulario de nuevo.')
        }

        await updateLead(waitedId, buildQuizUpdatePayload(answers))
        onComplete(payload)
      } catch (e) {
        setError(e.message || 'Algo falló. Probá de nuevo.')
        setLoading(false)
      }
      return
    }

    setCurrent((c) => c + 1)
  }

  const selectedAreas = BOTTLENECK_AREAS.filter((area) =>
    answers.bottleneckAreas.includes(area),
  )

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.stepLabel}>Pregunta {current + 1} de {STEPS.length}</div>
        <div className={styles.question}>{step.q}</div>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.body}>
        {step.type === 'options' && (
          <div className={styles.options}>
            {step.opts.map((opt) => (
              <button
                key={opt}
                className={`${styles.opt} ${answers[step.id] === opt ? styles.selected : ''}`}
                onClick={() => handleOption(opt)}
              >
                <span>{opt}</span>
                <i className="ti ti-arrow-right" />
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

        {step.type === 'form' && (
          <div className={styles.formFields}>
            <input
              className={styles.input}
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className={styles.input}
              type="tel"
              placeholder="Tu WhatsApp (ej +5491112345678)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              className={styles.input}
              type="email"
              placeholder="Tu email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.backBtn}
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
        >
          <i className="ti ti-arrow-left" /> Atrás
        </button>

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i < current ? styles.done : ''} ${i === current ? styles.active : ''}`}
            />
          ))}
        </div>

        <button
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={!canNext || loading}
        >
          {loading ? (
            <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isLast ? (
            <><span>Quiero mi diagnóstico</span><i className="ti ti-arrow-right" /></>
          ) : (
            <i className="ti ti-arrow-right" />
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
