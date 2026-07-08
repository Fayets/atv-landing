const COURSE_URL = import.meta.env.VITE_COURSE_URL || import.meta.env.VITE_LANDING_URL || 'https://atvos.io/course'

function getFirstName(name) {
  return (name || '').trim().split(/\s+/)[0] || ''
}

function getLeadProblema(lead) {
  const subs = [
    ...(lead.bottleneck_marketing || []),
    ...(lead.bottleneck_ventas || []),
    ...(lead.bottleneck_producto || []),
    ...(lead.bottleneck_sistemas || []),
  ]
  if (subs.length > 0) return subs[0].toLowerCase()
  if (lead.avatar) return lead.avatar.toLowerCase()
  const areas = (lead.bottleneck_areas || []).join(' y ')
  if (areas) return `problemas en ${areas}`.toLowerCase()
  return 'tu situación'
}

function isLeadComplete(lead) {
  return lead.avatar != null && lead.avatar !== ''
}

function buildSoloDatosMessage(lead) {
  const nombre = getFirstName(lead.name)
  return (
    `hola ${nombre}, por acá juan\n\n` +
    'te escribo directo porque el acceso que arrancaste a pedir tiene cupo y no quiero que lo pierdas por lo del formulario\n\n' +
    'lo dejaste de llenar por algo puntual o se te complicó nomás?\n\n' +
    'avisame y lo resolvemos por acá'
  )
}

function buildCompletoMessage(lead) {
  const link = COURSE_URL
  const problema = getLeadProblema(lead)
  return (
    `buenas, como andamos? por acá juan\n\n` +
    `te dejo el link de la landing:\n${link}\n\n` +
    `vi que venías con ${problema}, contame un poco más asi te doy una mano con lo que te va a funcionar del curso, si no tambien te puedo dar recursos mas exclusivos que te van ayudar aún más\n\n\n` +
    'mandame un audio si querés, no me molesta'
  )
}

export function buildSetterWhatsappMessage(lead) {
  if (isLeadComplete(lead)) return buildCompletoMessage(lead)
  return buildSoloDatosMessage(lead)
}

export function buildSetterWhatsappUrl(lead) {
  const digits = (lead.phone || '').replace(/\D/g, '')
  const text = encodeURIComponent(buildSetterWhatsappMessage(lead))
  return `https://wa.me/${digits}?text=${text}`
}
