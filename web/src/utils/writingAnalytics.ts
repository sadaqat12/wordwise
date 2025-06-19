// Writing Analytics Utility - Similar to Grammarly's Performance Metrics
export interface WritingMetrics {
  // Text Quality Score
  textScore: number
  
  // Word Count Metrics
  characters: number
  words: number
  sentences: number
  readingTime: number // in seconds
  speakingTime: number // in seconds
  
  // Readability Metrics
  averageWordsPerSentence: number
  averageCharactersPerWord: number
  readabilityScore: number // Flesch Reading Ease score
  readabilityLevel: string // Grade level description
  
  // Vocabulary Metrics
  uniqueWordsPercentage: number
  rareWordsPercentage: number
  vocabularyScore: number
  
  // Comparative metrics
  wordLengthRating: 'below_average' | 'average' | 'above_average'
  sentenceLengthRating: 'below_average' | 'average' | 'above_average'
  uniqueWordsRating: 'below_average' | 'average' | 'above_average'
  rareWordsRating: 'below_average' | 'average' | 'above_average'
}

// Common rare/advanced words (subset for demo)
const RARE_WORDS = new Set([
  'ubiquitous', 'paradigm', 'synergy', 'leverage', 'implement', 'facilitate',
  'optimize', 'maximize', 'utilize', 'comprehensive', 'substantial', 'significant',
  'fundamental', 'essential', 'crucial', 'strategic', 'innovative', 'sophisticated',
  'methodology', 'infrastructure', 'collaborate', 'communicate', 'demonstrate',
  'approximately', 'frequently', 'particularly', 'specifically', 'effectively'
])

// Average reading speeds (words per minute)
const AVERAGE_READING_WPM = 200
const AVERAGE_SPEAKING_WPM = 150

export function calculateWritingMetrics(text: string, suggestionsCount: number = 0): WritingMetrics {
  // Basic text processing
  const cleanText = text.trim()
  const characters = cleanText.length
  const words = cleanText.length > 0 ? cleanText.split(/\s+/).filter(word => word.length > 0) : []
  const wordCount = words.length
  
  // Sentence counting (split by periods, exclamation marks, question marks)
  const sentences = cleanText.length > 0 
    ? cleanText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
    : []
  const sentenceCount = Math.max(sentences.length, 1) // Avoid division by zero
  
  // Time calculations
  const readingTime = Math.max(1, Math.round((wordCount / AVERAGE_READING_WPM) * 60))
  const speakingTime = Math.max(1, Math.round((wordCount / AVERAGE_SPEAKING_WPM) * 60))
  
  // Readability calculations
  const averageWordsPerSentence = wordCount / sentenceCount
  const averageCharactersPerWord = wordCount > 0 ? characters / wordCount : 0
  
  // Flesch Reading Ease Score
  const fleschScore = calculateFleschScore(averageWordsPerSentence, averageCharactersPerWord)
  const readabilityLevel = getReadabilityLevel(fleschScore)
  
  // Vocabulary analysis
  const uniqueWords = new Set(words.map(word => word.toLowerCase().replace(/[^\w]/g, '')))
  const uniqueWordsPercentage = wordCount > 0 ? (uniqueWords.size / wordCount) * 100 : 0
  
  const rareWords = words.filter(word => 
    RARE_WORDS.has(word.toLowerCase().replace(/[^\w]/g, ''))
  )
  const rareWordsPercentage = wordCount > 0 ? (rareWords.length / wordCount) * 100 : 0
  
  // Text quality score (based on suggestions and metrics)
  const textScore = calculateTextScore(wordCount, suggestionsCount, fleschScore, uniqueWordsPercentage)
  
  // Vocabulary score (combination of unique and rare words)
  const vocabularyScore = Math.round((uniqueWordsPercentage + rareWordsPercentage) / 2)
  
  // Comparative ratings (based on typical benchmarks)
  const wordLengthRating = getRating(averageCharactersPerWord, 4.0, 5.5)
  const sentenceLengthRating = getRating(averageWordsPerSentence, 12, 20)
  const uniqueWordsRating = getRating(uniqueWordsPercentage, 60, 80)
  const rareWordsRating = getRating(rareWordsPercentage, 15, 30)
  
  return {
    textScore,
    characters,
    words: wordCount,
    sentences: sentenceCount,
    readingTime,
    speakingTime,
    averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
    averageCharactersPerWord: Math.round(averageCharactersPerWord * 10) / 10,
    readabilityScore: Math.round(fleschScore),
    readabilityLevel,
    uniqueWordsPercentage: Math.round(uniqueWordsPercentage),
    rareWordsPercentage: Math.round(rareWordsPercentage),
    vocabularyScore,
    wordLengthRating,
    sentenceLengthRating,
    uniqueWordsRating,
    rareWordsRating
  }
}

function calculateFleschScore(avgWordsPerSentence: number, avgCharactersPerWord: number): number {
  // Better approximation for syllables based on word length
  // More realistic than the previous method
  let avgSyllablesPerWord: number
  
  if (avgCharactersPerWord <= 3) {
    avgSyllablesPerWord = 1.0  // Short words are usually 1 syllable
  } else if (avgCharactersPerWord <= 5) {
    avgSyllablesPerWord = 1.5  // Medium words average 1.5 syllables
  } else if (avgCharactersPerWord <= 7) {
    avgSyllablesPerWord = 2.0  // Longer words average 2 syllables
  } else {
    avgSyllablesPerWord = 2.5  // Very long words average 2.5+ syllables
  }
  
  // Apply Flesch Reading Ease formula with better syllable approximation
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  
  // Ensure score is within reasonable bounds (0-100)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function getReadabilityLevel(fleschScore: number): string {
  if (fleschScore >= 90) return 'Very easy to read (5th grade level)'
  if (fleschScore >= 80) return 'Easy to read (6th grade level)'
  if (fleschScore >= 70) return 'Fairly easy to read (7th grade level)'
  if (fleschScore >= 60) return 'Standard reading level (8th-9th grade)'
  if (fleschScore >= 50) return 'Fairly difficult (10th-12th grade)'
  if (fleschScore >= 30) return 'Difficult (college level)'
  return 'Very difficult (graduate level)'
}

function calculateTextScore(wordCount: number, suggestionsCount: number, readabilityScore: number, uniqueWords: number): number {
  if (wordCount === 0) return 0
  
  // Start with a more generous base score of 85 (good writing baseline)
  let score = 85
  
  // Suggestions penalty - reduced impact, more forgiving
  const suggestionPenalty = Math.min(25, suggestionsCount * 1.5) // Max 25 point deduction, 1.5 per suggestion
  score -= suggestionPenalty
  
  // Readability bonuses/penalties - more balanced
  if (readabilityScore >= 60) {
    score += 10 // Bonus for good readability
  } else if (readabilityScore >= 40) {
    score += 5  // Small bonus for decent readability
  } else if (readabilityScore < 20) {
    score -= 5  // Small penalty only for very poor readability
  }
  
  // Vocabulary diversity - more realistic thresholds
  if (uniqueWords >= 70) {
    score += 8  // Good vocabulary diversity
  } else if (uniqueWords >= 60) {
    score += 4  // Decent vocabulary diversity
  } else if (uniqueWords < 40) {
    score -= 3  // Small penalty for very repetitive text
  }
  
  // Bonus for longer, more substantial content
  if (wordCount >= 100) {
    score += 2  // Bonus for substantial content
  }
  
  return Math.max(30, Math.min(100, Math.round(score))) // Minimum score of 30, max 100
}

function getRating(value: number, lowThreshold: number, highThreshold: number): 'below_average' | 'average' | 'above_average' {
  if (value < lowThreshold) return 'below_average'
  if (value > highThreshold) return 'above_average'
  return 'average'
}

export function getRatingColor(rating: 'below_average' | 'average' | 'above_average'): string {
  switch (rating) {
    case 'below_average': return 'text-red-600'
    case 'average': return 'text-yellow-600' 
    case 'above_average': return 'text-green-600'
  }
}

export function getRatingText(rating: 'below_average' | 'average' | 'above_average'): string {
  switch (rating) {
    case 'below_average': return 'Below average'
    case 'average': return 'Average'
    case 'above_average': return 'Above average'
  }
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
} 