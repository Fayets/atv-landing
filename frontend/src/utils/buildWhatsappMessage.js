const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || '5491162626702'

export function buildWhatsappUrl(data) {
  const areas = []
  if (data.bottleneck_marketing?.length) {
    areas.push(`Marketing:\n${data.bottleneck_marketing.map(o => `- ${o}`).join('\n')}`)
  }
  if (data.bottleneck_ventas?.length) {
    areas.push(`Ventas:\n${data.bottleneck_ventas.map(o => `- ${o}`).join('\n')}`)
  }
  if (data.bottleneck_producto?.length) {
    areas.push(`Producto:\n${data.bottleneck_producto.map(o => `- ${o}`).join('\n')}`)
  }
  if (data.bottleneck_sistemas?.length) {
    areas.push(`Sistemas:\n${data.bottleneck_sistemas.map(o => `- ${o}`).join('\n')}`)
  }

  const msg = encodeURIComponent(
    `Hola! Acabo de completar mi registro en ATV.\n` +
    `Quiero recibir mi acceso al contenido.\n\n` +
    `DATOS DE CONTACTO\n` +
    `Nombre: ${data.name}\n` +
    `Email: ${data.email}\n` +
    `WhatsApp: ${data.phone}\n\n` +
    `MI SITUACIÓN\n` +
    `Perfil: ${data.avatar || '-'}\n` +
    `Facturación mensual: ${data.revenue || '-'}\n\n` +
    `CUELLO DE BOTELLA\n` +
    `${areas.join('\n') || '-'}\n\n` +
    `MI CLAVE DE ACCESO\n` +
    `${data.access_code}`
  )
  return `https://wa.me/${WA_NUMBER}?text=${msg}`
}
