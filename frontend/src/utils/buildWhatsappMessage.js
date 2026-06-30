const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || '5491162626702'

export function buildWhatsappUrl(data) {
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
  return `https://wa.me/${WA_NUMBER}?text=${msg}`
}
