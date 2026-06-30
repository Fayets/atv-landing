import { useState } from 'react'
import Quiz from '../components/Quiz'
import Diagnosis from '../components/Diagnosis'
import QualifyingQuestions from '../components/QualifyingQuestions'
import InstagramSuccess from '../components/InstagramSuccess'
import styles from './LandingPage.module.css'

function toDiagnosisAnswers(quizPayload) {
  return {
    avatar: quizPayload.avatar,
    bottleneckAreas: quizPayload.bottleneck_areas || [],
    bottleneckMarketing: quizPayload.bottleneck_marketing || [],
    bottleneckVentas: quizPayload.bottleneck_ventas || [],
    bottleneckProducto: quizPayload.bottleneck_producto || [],
    bottleneckSistemas: quizPayload.bottleneck_sistemas || [],
    revenue: quizPayload.revenue,
  }
}

export default function LandingPage({ onComplete }) {
  const [phase, setPhase] = useState('quiz')
  const [quizAnswers, setQuizAnswers] = useState(null)
  const [diagnosisText, setDiagnosisText] = useState('')

  const handleQuizComplete = (payload) => {
    setQuizAnswers(payload)
    setPhase('diagnosis')
  }

  const handleDiagnosisContinue = (text) => {
    setDiagnosisText(text)
    setPhase('qualifying')
  }

  const handleQualifyingComplete = (qualifyingData) => {
    onComplete({
      ...quizAnswers,
      diagnosisText,
      ...qualifyingData,
    })
  }

  const renderFlow = () => {
    if (phase === 'quiz') {
      return <Quiz onComplete={handleQuizComplete} />
    }
    if (phase === 'diagnosis') {
      return (
        <Diagnosis
          answers={toDiagnosisAnswers(quizAnswers)}
          onContinue={handleDiagnosisContinue}
        />
      )
    }
    return <QualifyingQuestions onComplete={handleQualifyingComplete} />
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroTop}>
        <img src="/ATVLogin.png" alt="ATV" className={styles.logo} width={28} height={28} />
      </div>

      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.eyebrow}>
          <i className="ti ti-bolt" /> Diagnóstico de escalabilidad
        </div>
        <h1 className={styles.headline}>
          Descubrí qué te falta<br />
          para escalar a <em>6 cifras</em>
        </h1>
        <p className={styles.sub}>
          Respondé 5 preguntas y recibí tu diagnóstico de escalabilidad personalizado. El roadmap concreto para tu situación, sin vueltas.
        </p>

        <div className={styles.socialProof}>
          <div className={styles.avatars}>
            {['JC','MA','LS','EM','NI'].map((i, idx) => (
              <div key={idx} className={`${styles.av} ${idx % 2 === 0 ? styles.avRed : ''}`}>{i}</div>
            ))}
          </div>
          <span><strong>+1.200</strong> negocios ya lo hicieron</span>
          <span className={styles.dot} />
          <span>100% gratis</span>
        </div>

        {renderFlow()}
      </section>

      <div className={styles.stats}>
        {[
          { num: '+$5M', label: 'Generados por clientes ATV' },
          { num: '1.200+', label: 'Negocios escalados' },
          { num: '92%', label: 'Clientes conformes' },
        ].map((s) => (
          <div key={s.num} className={styles.statItem}>
            <div className={styles.statNum}>{s.num}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <InstagramSuccess />

      <div className={styles.footerCta}>
        <h2>¿Listo para escalar?</h2>
        <p>Hacé el diagnóstico de escalabilidad — es gratis y te lleva menos de 3 minutos</p>
        <button
          className={styles.ctaBtn}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="ti ti-bolt" /> Hacer mi diagnóstico de escalabilidad
        </button>
      </div>

      <footer className={styles.footer}>
        <img src="/ATVLogin.png" alt="ATV — Aumenta Tu Valor" className={styles.logo} width={36} height={36} />
        <span>© 2026 Aumenta Tu Valor · Todos los derechos reservados</span>
        <span>Privacidad · Términos</span>
      </footer>
    </div>
  )
}
