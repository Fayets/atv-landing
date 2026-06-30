import { useState } from 'react'
import styles from './Quiz.module.css'
import { submitLead } from '../api/leads'

const BOTTLENECK_AREAS = ['Marketing', 'Ventas', 'Producto', 'Sistemas']

const BOTTLENECK_SUB_OPTS = {
  Marketing: [
    'No genero suficientes leads',
    'Mis leads son de mala calidad / no califican',
    'No tengo contenido que convierta',
    'No sé cómo monetizar mi audiencia',
    'Mi costo por lead es muy alto',
  ],
  Ventas: [
    'No cierro suficientes llamadas',
    'Mi tasa de show-up es baja',
    'No tengo un proceso de seguimiento claro',
    'No sé manejar objeciones de precio',
    'Mis setters no agendan suficiente',
  ],
  Producto: [
    'Mis clientes no obtienen resultados',
    'Tasa de refund alta',
    'Mi oferta no está bien definida',
    'No sé cómo subir mis precios',
    'El producto depende demasiado de mí',
  ],
  Sistemas: [
    'Todo pasa por mí, no puedo delegar',
    'No tengo procesos documentados',
    'Mi equipo no rinde sin supervisión constante',
    'No tengo métricas claras de mi negocio',
    'No puedo escalar sin contratar más gente',
  ],
}

const AREA_TO_ANSWER_KEY = {
  Marketing: 'bottleneckMarketing',
  Ventas: 'bottleneckVentas',
  Producto: 'bottleneckProducto',
  Sistemas: 'bottleneckSistemas',
}

const INITIAL_ANSWERS = {
  avatar: '',
  bottleneckAreas: [],
  bottleneckMarketing: [],
  bottleneckVentas: [],
  bottleneckProducto: [],
  bottleneckSistemas: [],
  revenue: '',
}

const STEPS = [
  {
    id: 'avatar',
    q: '¿Cuál de estas opciones describe mejor tu perfil hoy en día?',
    type: 'options',
    opts: [
      'Creador de contenido',
      'Creador de contenido con infoproducto',
      'Experto en infoproducto / Growth Operator',
      'Dueño de Negocio',
      'Dueño de Agencia',
      'Habilidades de alto valor (setter, closer, content, etc.)',
      'Otro',
    ],
  },
  {
    id: 'bottleneck',
    q: '¿Dónde estaría el cuello de botella en tu negocio?',
    type: 'bottleneck',
  },
  {
    id: 'revenue',
    q: '¿Cuánto estás generando a día de hoy con tu negocio?',
    type: 'options',
    opts: [
      '1k a 5k',
      '5k a 10k',
      '10k a 30k',
      '30k a 50k',
      '+50k',
    ],
  },
  {
    id: 'contact',
    q: 'Dejame tus datos y te mando el diagnóstico de escalabilidad',
    type: 'form',
  },
]

function isBottleneckValid(answers) {
  if (answers.bottleneckAreas.length === 0) return false
  return answers.bottleneckAreas.every((area) => {
    const key = AREA_TO_ANSWER_KEY[area]
    return answers[key].length > 0
  })
}

function buildPayload(answers, form) {
  return {
    avatar: answers.avatar,
    bottleneck_areas: answers.bottleneckAreas,
    bottleneck_marketing: answers.bottleneckMarketing,
    bottleneck_ventas: answers.bottleneckVentas,
    bottleneck_producto: answers.bottleneckProducto,
    bottleneck_sistemas: answers.bottleneckSistemas,
    revenue: answers.revenue,
    name: form.name,
    email: form.email,
    phone: form.phone,
  }
}

export default function Quiz({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(INITIAL_ANSWERS)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    if (isLast) {
      setLoading(true)
      setError(null)
      try {
        const payload = buildPayload(answers, form)
        await submitLead(payload)
        onComplete(payload)
      } catch (e) {
        setError('Algo falló. Probá de nuevo.')
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
            <><span>Quiero mi diagnóstico de escalabilidad</span><i className="ti ti-arrow-right" /></>
          ) : (
            <i className="ti ti-arrow-right" />
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
