import { REVENUE_QUALIFIED, AVATAR_QUALIFIED } from '../data/landingQuiz'

export function esCalificado(data) {
  const avatarOk = AVATAR_QUALIFIED.includes(data.avatar)
  const revenueOk = REVENUE_QUALIFIED.includes(data.revenue)
  return avatarOk && revenueOk
}
