const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || '5491162626702'

const AREA_DETAIL_FIELDS = {
  Marketing: 'bottleneck_marketing',
  Ventas: 'bottleneck_ventas',
  Producto: 'bottleneck_producto',
}

function formatBottleneckDetails(data) {
  const areas = data?.bottleneck_areas || []
  if (areas.length === 0) return 'Sin especificar'

  return areas.map((area) => {
    const field = AREA_DETAIL_FIELDS[area]
    const subs = field ? (data[field] || []) : []
    if (subs.length === 0) return `${area}: sin detalle`
    return `${area}:\n${subs.map((item) => `- ${item}`).join('\n')}`
  }).join('\n\n')
}

export function buildAccessWhatsappMessage(data) {
  return [
    'Hola! Acabo de completar mi registro en ATV.',
    '',
    'DATOS DE CONTACTO',
    `Nombre: ${data?.name || '-'}`,
    `Email: ${data?.email || '-'}`,
    `WhatsApp: ${data?.phone || '-'}`,
    '',
    'MI SITUACIÓN',
    `Perfil: ${data?.avatar || 'Sin especificar'}`,
    `Facturación mensual: ${data?.revenue || 'Sin especificar'}`,
    '',
    'CUELLO DE BOTELLA',
    formatBottleneckDetails(data),
    '',
    'MI CLAVE DE ACCESO',
    data?.access_code || '-',
    '',
    'Quiero recibir mi acceso al contenido.',
  ].join('\n')
}

export function buildAccessWhatsappUrl(data) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildAccessWhatsappMessage(data))}`
}

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
