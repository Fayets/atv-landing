import styles from './ThankYouPage.module.css'

const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || '5491112345678'

export default function ThankYouPage({ data }) {
  const msg = encodeURIComponent(
    `Hola! Acabo de hacer el diagnóstico de escalabilidad ATV.\n\n` +
    `Nombre: ${data?.name}\n` +
    `Avatar: ${data?.avatar}\n` +
    `Áreas de cuello de botella: ${(data?.bottleneck_areas || []).join(', ')}\n` +
    `Facturación actual: ${data?.revenue}\n\n` +
    `Datos de mi operación:\n` +
    `- Agendas por mes: ${data?.agendas}\n` +
    `- Conversaciones por mes: ${data?.conversaciones}\n` +
    `- % agenda: ${data?.pctAgenda}\n` +
    `- % cierre: ${data?.pctCierre}\n` +
    `- % show-up: ${data?.pctShowUp}\n\n` +
    `Quiero recibir mi diagnóstico de escalabilidad personalizado.`
  )
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${msg}`

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <img src={`${import.meta.env.BASE_URL}ATVLogin.png`} alt="ATV — Aumenta Tu Valor" className={styles.logo} width={36} height={36} />
      </nav>

      <div className={styles.center}>
        <div className={styles.iconWrap}>
          <i className="ti ti-check" />
        </div>
        <h1 className={styles.title}>Tu diagnóstico de escalabilidad está listo</h1>
        <p className={styles.sub}>
          Con tus respuestas armamos tu plan de escalabilidad personalizado. Un especialista te lo manda por WhatsApp en las próximas horas.
        </p>

        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
          <i className="ti ti-brand-whatsapp" />
          Recibir mi diagnóstico de escalabilidad
        </a>

        <p className={styles.disclaimer}>
          Solo le respondemos a quien completa el formulario. Sin spam.
        </p>
      </div>
    </div>
  )
}
