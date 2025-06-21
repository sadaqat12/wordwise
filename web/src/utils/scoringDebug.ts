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

export async function getScoreBreakdown(text: string, suggestionsCount: number): Promise<ScoreBreakdown> {
  const metrics = await calculateWritingMetrics(text, suggestionsCount)
  
  // Recreate the scoring logic for debugging (using updated algorithm)
  let score = 70 // Updated base score
  const explanation: string[] = []
  
  explanation.push(`Starting with base score: ${score}/100`)
  
  // If no suggestions, perfect score
  if (suggestionsCount === 0) {
    explanation.push(`No suggestions found: Perfect score = 100/100`)
    return {
      baseScore: 70,
      suggestionPenalty: 0,
      readabilityBonus: 0,
      vocabularyBonus: 0,
      lengthBonus: 0,
      finalScore: 100,
      explanation: [...explanation, `Final Score: 100/100`]
    }
  }
  
  // Suggestion penalty (updated algorithm)
  const suggestionPenalty = Math.min(45, suggestionsCount * 5)
  let extraPenalty = 0
  if (suggestionsCount >= 5) {
    extraPenalty = 10
  }
  
  score -= suggestionPenalty + extraPenalty
  if (suggestionPenalty > 0) {
    explanation.push(`Suggestion penalty: -${suggestionPenalty} (${suggestionsCount} suggestions × 5 each)`)
    if (extraPenalty > 0) {
      explanation.push(`Multiple errors penalty: -${extraPenalty} (5+ suggestions)`)
    }
  }
  
  // Readability bonus/penalty (updated)
  let readabilityBonus = 0
  if (metrics.readabilityScore >= 70) {
    readabilityBonus = 12
    explanation.push(`Excellent readability bonus: +${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else if (metrics.readabilityScore >= 60) {
    readabilityBonus = 8
    explanation.push(`Good readability bonus: +${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else if (metrics.readabilityScore >= 50) {
    readabilityBonus = 4
    explanation.push(`Decent readability bonus: +${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else if (metrics.readabilityScore < 30) {
    readabilityBonus = -10
    explanation.push(`Very poor readability penalty: ${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else if (metrics.readabilityScore < 40) {
    readabilityBonus = -6
    explanation.push(`Poor readability penalty: ${readabilityBonus} (readability score: ${metrics.readabilityScore})`)
  } else {
    explanation.push(`Average readability: +0 (readability score: ${metrics.readabilityScore})`)
  }
  score += readabilityBonus
  
  // Vocabulary bonus/penalty (updated)
  let vocabularyBonus = 0
  if (metrics.uniqueWordsPercentage >= 85) {
    vocabularyBonus = 12
    explanation.push(`Exceptional vocabulary diversity: +${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else if (metrics.uniqueWordsPercentage >= 75) {
    vocabularyBonus = 8
    explanation.push(`Excellent vocabulary diversity: +${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else if (metrics.uniqueWordsPercentage >= 65) {
    vocabularyBonus = 4
    explanation.push(`Good vocabulary diversity: +${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else if (metrics.uniqueWordsPercentage < 45) {
    vocabularyBonus = -10
    explanation.push(`Very repetitive vocabulary penalty: ${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else if (metrics.uniqueWordsPercentage < 55) {
    vocabularyBonus = -5
    explanation.push(`Below average vocabulary penalty: ${vocabularyBonus} (${metrics.uniqueWordsPercentage}% unique words)`)
  } else {
    explanation.push(`Average vocabulary diversity: +0 (${metrics.uniqueWordsPercentage}% unique words)`)
  }
  score += vocabularyBonus
  
  // Perfect writing bonus
  let perfectBonus = 0
  if (suggestionsCount === 0 && metrics.readabilityScore >= 60 && metrics.uniqueWordsPercentage >= 70) {
    perfectBonus = 15
    explanation.push(`Perfect writing bonus: +${perfectBonus} (no errors + good readability + good vocabulary)`)
  }
  score += perfectBonus
  
  // Final constraints (updated range)
  const finalScore = Math.max(5, Math.min(100, Math.round(score)))
  if (finalScore !== Math.round(score)) {
    explanation.push(`Applied score limits (5-100): ${Math.round(score)} → ${finalScore}`)
  }
  
  explanation.push(`\nFinal Score: ${finalScore}/100`)
  
  return {
    baseScore: 70,
    suggestionPenalty: -(suggestionPenalty + extraPenalty),
    readabilityBonus,
    vocabularyBonus,
    lengthBonus: perfectBonus, // Using this field for perfect bonus since length is no longer used
    finalScore,
    explanation
  }
} 