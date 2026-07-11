import { REVENUE_QUALIFIED } from '../data/landingQuiz'

export function esCalificado(data) {
  return REVENUE_QUALIFIED.includes(data.revenue)
}
