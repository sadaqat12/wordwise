import { calculateWritingMetrics } from './writingAnalytics'

export interface ScoreBreakdown {
  baseScore: number
  suggestionPenalty: number
  readabilityBonus: number
  vocabularyBonus: number
  lengthBonus: number
  finalScore: number
  explanation: string[]
}

export function getScoreBreakdown(text: string, suggestionsCount: number): ScoreBreakdown {
  const metrics = calculateWritingMetrics(text, suggestionsCount)
  
  // Recreate the scoring logic for debugging
  let score = 85 // Base score
  const explanation: string[] = []
  
  explanation.push(`Starting with base score: ${score}/100`)
  
  // Suggestion penalty
  const suggestionPenalty = Math.min(25, suggestionsCount * 1.5)
  score -= suggestionPenalty
  if (suggestionPenalty > 0) {
    explanation.push(`Pending suggestions penalty: -${suggestionPenalty} (${suggestionsCount} suggestions × 1.5 each)`)
  } else {
    explanation.push(`No pending suggestions: +0 (excellent!)`)
  }
  
  // Readability bonus/penalty
  let readabilityBonus = 0
  if (metrics.readabilityScore >= 60) {
    readabilityBonus = 10
    explanation.push(`Good readability bonus: +${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else if (metrics.readabilityScore >= 40) {
    readabilityBonus = 5
    explanation.push(`Decent readability bonus: +${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else if (metrics.readabilityScore < 20) {
    readabilityBonus = -5
    explanation.push(`Poor readability penalty: ${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else {
    explanation.push(`Neutral readability: +0 (readability score: ${metrics.readabilityScore})`)
  }
  score += readabilityBonus
  
  // Vocabulary bonus/penalty  
  let vocabularyBonus = 0
  if (metrics.uniqueWordsPercentage >= 70) {
    vocabularyBonus = 8
    explanation.push(`Excellent vocabulary diversity: +${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else if (metrics.uniqueWordsPercentage >= 60) {
    vocabularyBonus = 4
    explanation.push(`Good vocabulary diversity: +${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else if (metrics.uniqueWordsPercentage < 40) {
    vocabularyBonus = -3
    explanation.push(`Repetitive vocabulary penalty: ${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else {
    explanation.push(`Average vocabulary diversity: +0 (${metrics.uniqueWordsPercentage}% unique words)`)
  }
  score += vocabularyBonus
  
  // Length bonus
  let lengthBonus = 0
  if (metrics.words >= 100) {
    lengthBonus = 2
    explanation.push(`Substantial content bonus: +${lengthBonus} (${metrics.words} words)`)
  } else {
    explanation.push(`Short content: +0 (${metrics.words} words - bonus at 100+ words)`)
  }
  score += lengthBonus
  
  // Final constraints
  const finalScore = Math.max(30, Math.min(100, Math.round(score)))
  if (finalScore !== score) {
    explanation.push(`Applied score limits (30-100): ${Math.round(score)} → ${finalScore}`)
  }
  
  explanation.push(`\nFinal Score: ${finalScore}/100`)
  
  return {
    baseScore: 85,
    suggestionPenalty: -suggestionPenalty,
    readabilityBonus,
    vocabularyBonus,
    lengthBonus,
    finalScore,
    explanation
  }
} 