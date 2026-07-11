const REVENUE_CAL = ['$10k a $30k', '$30k a $50k', '+$50k']

export function esCalificado(data) {
  return REVENUE_CAL.includes(data.revenue)
}
