// Writing Analytics Utility - Similar to Grammarly's Performance Metrics
import { supabase } from '../store'

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
  
  // Comparative metrics (now percentile-based)
  wordLengthRating: 'below_average' | 'average' | 'above_average'
  sentenceLengthRating: 'below_average' | 'average' | 'above_average'
  uniqueWordsRating: 'below_average' | 'average' | 'above_average'
  rareWordsRating: 'below_average' | 'average' | 'above_average'
}

// Database percentiles cache
interface DatabasePercentiles {
  averageCharactersPerWord: { p25: number; p75: number }
  averageWordsPerSentence: { p25: number; p75: number }
  uniqueWordsPercentage: { p25: number; p75: number }
  rareWordsPercentage: { p25: number; p75: number }
  lastUpdated: number
}

let percentilesCache: DatabasePercentiles | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

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

// Fallback thresholds if database query fails
const FALLBACK_THRESHOLDS = {
  averageCharactersPerWord: { p25: 4.0, p75: 5.5 },
  averageWordsPerSentence: { p25: 12, p75: 20 },
  uniqueWordsPercentage: { p25: 60, p75: 80 },
  rareWordsPercentage: { p25: 15, p75: 30 }
}

async function calculateDatabasePercentiles(): Promise<DatabasePercentiles> {
  try {
    console.log('📊 Calculating database percentiles from user documents...')
    
    // Fetch all documents to calculate metrics
    const { data: documents, error } = await supabase
      .from('documents')
      .select('content')
      .not('content', 'is', null)
      .neq('content', '')
      .limit(1000) // Limit to recent 1000 documents for performance
    
    if (error) {
      console.error('Error fetching documents for percentiles:', error)
      return {
        ...FALLBACK_THRESHOLDS,
        lastUpdated: Date.now()
      }
    }
    
    if (!documents || documents.length < 10) {
      console.log('📊 Not enough documents for percentiles, using fallback thresholds')
      return {
        ...FALLBACK_THRESHOLDS,
        lastUpdated: Date.now()
      }
    }
    
    // Calculate metrics for each document
    const allMetrics = documents.map(doc => {
      const content = doc.content || ''
      const words = content.trim().length > 0 ? content.split(/\s+/).filter((word: string) => word.length > 0) : []
      const sentences = content.trim().length > 0 ? content.split(/[.!?]+/).filter((sentence: string) => sentence.trim().length > 0) : []
      
      const wordCount = words.length
      const sentenceCount = Math.max(sentences.length, 1)
      const characters = content.length
      
      const averageWordsPerSentence = wordCount / sentenceCount
      const averageCharactersPerWord = wordCount > 0 ? characters / wordCount : 0
      
      // Vocabulary analysis
      const uniqueWords = new Set(words.map((word: string) => word.toLowerCase().replace(/[^\w]/g, '')))
      const uniqueWordsPercentage = wordCount > 0 ? (uniqueWords.size / wordCount) * 100 : 0
      
      const rareWords = words.filter((word: string) => RARE_WORDS.has(word.toLowerCase().replace(/[^\w]/g, '')))
      const rareWordsPercentage = wordCount > 0 ? (rareWords.length / wordCount) * 100 : 0
      
      return {
        averageWordsPerSentence,
        averageCharactersPerWord,
        uniqueWordsPercentage,
        rareWordsPercentage
      }
    }).filter(metrics => 
      // Filter out invalid metrics
      metrics.averageWordsPerSentence > 0 && 
      metrics.averageCharactersPerWord > 0
    )
    
    console.log(`📊 Calculated metrics for ${allMetrics.length} documents`)
    
    if (allMetrics.length < 10) {
      console.log('📊 Not enough valid metrics, using fallback thresholds')
      return {
        ...FALLBACK_THRESHOLDS,
        lastUpdated: Date.now()
      }
    }
    
    // Calculate percentiles
    const calculatePercentile = (values: number[], percentile: number): number => {
      const sorted = [...values].sort((a, b) => a - b)
      const index = (percentile / 100) * (sorted.length - 1)
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      const weight = index - lower
      
      return sorted[lower] * (1 - weight) + sorted[upper] * weight
    }
    
    const percentiles: DatabasePercentiles = {
      averageCharactersPerWord: {
        p25: calculatePercentile(allMetrics.map(m => m.averageCharactersPerWord), 25),
        p75: calculatePercentile(allMetrics.map(m => m.averageCharactersPerWord), 75)
      },
      averageWordsPerSentence: {
        p25: calculatePercentile(allMetrics.map(m => m.averageWordsPerSentence), 25),
        p75: calculatePercentile(allMetrics.map(m => m.averageWordsPerSentence), 75)
      },
      uniqueWordsPercentage: {
        p25: calculatePercentile(allMetrics.map(m => m.uniqueWordsPercentage), 25),
        p75: calculatePercentile(allMetrics.map(m => m.uniqueWordsPercentage), 75)
      },
      rareWordsPercentage: {
        p25: calculatePercentile(allMetrics.map(m => m.rareWordsPercentage), 25),
        p75: calculatePercentile(allMetrics.map(m => m.rareWordsPercentage), 75)
      },
      lastUpdated: Date.now()
    }
    
    console.log('📊 Database percentiles calculated:', {
      wordLength: `${percentiles.averageCharactersPerWord.p25.toFixed(1)} - ${percentiles.averageCharactersPerWord.p75.toFixed(1)}`,
      sentenceLength: `${percentiles.averageWordsPerSentence.p25.toFixed(1)} - ${percentiles.averageWordsPerSentence.p75.toFixed(1)}`,
      uniqueWords: `${percentiles.uniqueWordsPercentage.p25.toFixed(1)}% - ${percentiles.uniqueWordsPercentage.p75.toFixed(1)}%`,
      rareWords: `${percentiles.rareWordsPercentage.p25.toFixed(1)}% - ${percentiles.rareWordsPercentage.p75.toFixed(1)}%`
    })
    
    return percentiles
  } catch (error) {
    console.error('Error calculating database percentiles:', error)
    return {
      ...FALLBACK_THRESHOLDS,
      lastUpdated: Date.now()
    }
  }
}

async function getDatabasePercentiles(): Promise<DatabasePercentiles> {
  // Check if cache is valid
  if (percentilesCache && Date.now() - percentilesCache.lastUpdated < CACHE_DURATION) {
    return percentilesCache
  }
  
  // Calculate new percentiles
  percentilesCache = await calculateDatabasePercentiles()
  return percentilesCache
}

export async function calculateWritingMetrics(text: string, suggestionsCount: number = 0): Promise<WritingMetrics> {
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
  
  // Get database percentiles for comparative ratings
  const percentiles = await getDatabasePercentiles()
  
  // Percentile-based comparative ratings
  const wordLengthRating = getPercentileRating(averageCharactersPerWord, percentiles.averageCharactersPerWord)
  const sentenceLengthRating = getPercentileRating(averageWordsPerSentence, percentiles.averageWordsPerSentence)
  const uniqueWordsRating = getPercentileRating(uniqueWordsPercentage, percentiles.uniqueWordsPercentage)
  const rareWordsRating = getPercentileRating(rareWordsPercentage, percentiles.rareWordsPercentage)
  
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

function getPercentileRating(value: number, percentiles: { p25: number; p75: number }): 'below_average' | 'average' | 'above_average' {
  if (value < percentiles.p25) return 'below_average'
  if (value > percentiles.p75) return 'above_average'
  return 'average'
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
  
  // If there are no suggestions, the writing is perfect!
  if (suggestionsCount === 0) {
    return 100
  }
  
  // Start with a realistic base score - average writing baseline
  let score = 70
  
  // MAJOR PENALTY: Suggestions (errors) significantly impact score
  if (suggestionsCount > 0) {
    // Each suggestion is a serious issue - heavy penalties
    const suggestionPenalty = Math.min(45, suggestionsCount * 5) // Up to 45 points deduction, 5 per suggestion
    score -= suggestionPenalty
    
    // Additional penalty for many errors (poor writing habits)
    if (suggestionsCount >= 5) {
      score -= 10 // Extra penalty for consistently poor writing
    }
  }
  
  // Readability scoring - focus on clarity and flow
  if (readabilityScore >= 70) {
    score += 12  // Excellent readability earns significant points
  } else if (readabilityScore >= 60) {
    score += 8   // Good readability
  } else if (readabilityScore >= 50) {
    score += 4   // Decent readability gets small bonus
  } else if (readabilityScore < 30) {
    score -= 10  // Very poor readability is heavily penalized
  } else if (readabilityScore < 40) {
    score -= 6   // Poor readability penalty
  }
  
  // Vocabulary diversity - shows writing sophistication
  if (uniqueWords >= 85) {
    score += 12 // Exceptional vocabulary diversity
  } else if (uniqueWords >= 75) {
    score += 8  // Excellent vocabulary diversity
  } else if (uniqueWords >= 65) {
    score += 4  // Good vocabulary diversity
  } else if (uniqueWords < 45) {
    score -= 10 // Very repetitive writing penalty
  } else if (uniqueWords < 55) {
    score -= 5  // Below average vocabulary
  }
  
  // Perfect writing bonus - only for truly excellent content
  if (suggestionsCount === 0 && readabilityScore >= 60 && uniqueWords >= 70) {
    score += 15 // Reward for genuinely good writing (no length requirement)
  }
  
  return Math.max(5, Math.min(100, Math.round(score))) // Minimum score of 5 (allow truly bad scores), max 100
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

export function formatTime(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds) || seconds < 1) return '0 sec'
  if (seconds < 60) return `${seconds} sec`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
} 