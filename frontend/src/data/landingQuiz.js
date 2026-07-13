export const BOTTLENECK_AREAS = ['Marketing', 'Ventas', 'Producto']

export const BOTTLENECK_SUB_OPTS = {
  Marketing: [
    'Mis leads son de mala calidad / no califican',
    'No tengo contenido que convierta (soy viral pero no vendo)',
    'Dependo de anuncios y mi orgánico no funciona',
    'No genero suficientes leads',
    'No tengo métricas claras de mi negocio',
  ],
  Ventas: [
    'Tengo un close rate bajo',
    'Mi tasa de show up rate es baja',
    'No tengo un proceso de ventas claro',
    'Tengo una tasa de agenda baja',
    'No tengo métricas claras de mi negocio',
  ],
  Producto: [
    'No tengo casos de éxito',
    'Tengo una alta tasa de refunds',
    'No tengo un sistema de upsell y recompras claro',
    'El producto depende demasiado de mí',
    'No tengo métricas claras de mi negocio',
  ],
}

export const AREA_TO_ANSWER_KEY = {
  Marketing: 'bottleneckMarketing',
  Ventas: 'bottleneckVentas',
  Producto: 'bottleneckProducto',
}

export const INITIAL_ANSWERS = {
  avatar: '',
  bottleneckAreas: [],
  bottleneckMarketing: [],
  bottleneckVentas: [],
  bottleneckProducto: [],
  revenue: '',
}

export const REVENUE_OPTIONS = [
  '$0 a 250 usd',
  '$250 a 500 usd',
  '$500 a 1k',
  '$1k a 3k',
  '$3k a 5k',
  '$5k a 10k',
  '$10k a 30k',
  '$30k a 50k',
  '+$50k',
]

export const REVENUE_QUALIFIED = ['$5k a 10k', '$10k a 30k', '$30k a 50k', '+$50k']

export const AVATAR_OPTIONS = [
  'Creador de contenido sin infoproducto',
  'Coaching / Mentoria / Consultoria',
  'Creador con infoproducto',
  'Experto en infoproductos / Growth Operator',
  'Dueño de negocio con tienda fisica',
  'Dueño de negocio con infoproducto',
  'Dueño de agencia',
  'Habilidades de alto valor (setter, closer, editor de videos, etc)',
  'Profesional independiente',
  'CCO (director)',
  'Tienda fisica',
  'Tienda de ecommerce',
  'Infoproducto de ecommerce',
  'No tengo negocio',
  'Agente inmobiliarios / Real State sin infoproducto',
  'Agente inmobiliarios / Real State con infoproducto',
  'Otro',
]

export const AVATAR_QUALIFIED = [
  'Coaching / Mentoria / Consultoria',
  'Creador con infoproducto',
  'Experto en infoproductos / Growth Operator',
  'Dueño de negocio con infoproducto',
  'Dueño de agencia',
  'Profesional independiente',
  'CCO (director)',
  'Infoproducto de ecommerce',
  'Agente inmobiliarios / Real State con infoproducto',
]

export const QUIZ_STEPS = [
  {
    id: 'contact',
    title: 'QUIERO MI LUGAR',
    question: null,
    type: 'form',
  },
  {
    id: 'avatar',
    title: 'SITUACIÓN ACTUAL',
    question: '¿Cuál es tu perfil hoy?',
    type: 'options',
    opts: AVATAR_OPTIONS,
  },
  {
    id: 'bottleneck',
    title: 'CUELLO DE BOTELLA',
    question: '¿Cuál es tu cuello de botella?',
    type: 'bottleneck',
  },
  {
    id: 'revenue',
    title: 'CALIFICACIÓN',
    question: '¿Cuánto facturas por mes hoy?',
    type: 'options',
    opts: REVENUE_OPTIONS,
  },
]

export function isBottleneckValid(answers) {
  if (answers.bottleneckAreas.length === 0) return false
  return answers.bottleneckAreas.every((area) => {
    const key = AREA_TO_ANSWER_KEY[area]
    return answers[key].length > 0
  })
}

export function buildQuizUpdatePayload(answers) {
  return {
    avatar: answers.avatar,
    bottleneck_areas: answers.bottleneckAreas,
    bottleneck_marketing: answers.bottleneckMarketing,
    bottleneck_ventas: answers.bottleneckVentas,
    bottleneck_producto: answers.bottleneckProducto,
    revenue: answers.revenue,
  }
}
