export function esCalificado(data) {
  const AVATARES_CAL = [
    'Creador/infoproductos',
    'Experto en infoproductos / Growth Operator',
    'Dueño de negocio',
    'Dueño de agencia',
  ]
  const REVENUE_CAL = ['10k a 30k', '30k a 50k', '+50k']
  const SUB_CAL = {
    bottleneck_marketing: [
      'Mis leads son de mala calidad/no califican',
      'Dependo de anuncios y mi orgánico no funciona',
      'No tengo métricas claras de mi negocio',
    ],
    bottleneck_ventas: [
      'Tengo un close rate bajo',
      'Mi tasa de show up rate es baja',
      'No tengo un proceso de ventas claro',
      'Tengo una tasa de agenda baja',
      'Dependo de referidos',
      'No tengo métricas claras de mi negocio',
    ],
    bottleneck_producto: [
      'Tengo una tasa alta de refunds',
      'No tengo un sistema de upsell y recompras claro',
      'El producto depende demasiado de mí',
      'No tengo métricas claras de mi negocio',
    ],
  }

  if (!AVATARES_CAL.includes(data.avatar)) return false
  if (!REVENUE_CAL.includes(data.revenue)) return false

  const tieneSubCal = Object.entries(SUB_CAL).some(([key, opts]) => {
    const selected = data[key] || []
    return selected.some(opt => opts.includes(opt))
  })

  return tieneSubCal
}
