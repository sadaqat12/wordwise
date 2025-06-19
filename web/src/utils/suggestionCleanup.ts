import { supabase } from '../store'

export interface CleanupStats {
  totalSuggestions: number
  duplicatesRemoved: number
  staleSuggestionsRemoved: number
  finalCount: number
}

export async function cleanupSuggestionDatabase(): Promise<CleanupStats> {
  console.log('🧹 Starting suggestion database cleanup...')
  
  // Get initial count
  const { count: initialCount } = await supabase
    .from('suggestions')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Initial suggestions count: ${initialCount || 0}`)
  
  // Step 1: Remove duplicate suggestions (same doc_id, original, suggestion)
  // Keep only the most recent one for each unique combination
  console.log('🔍 Finding and removing duplicate suggestions...')
  
  const { data: allSuggestions } = await supabase
    .from('suggestions')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (!allSuggestions) {
    throw new Error('Failed to fetch suggestions for cleanup')
  }
  
  // Group by document and unique suggestion content
  const suggestionGroups = new Map<string, any[]>()
  
  allSuggestions.forEach(suggestion => {
    const key = `${suggestion.doc_id}-${suggestion.original}-${suggestion.suggestion}-${suggestion.status}`
    if (!suggestionGroups.has(key)) {
      suggestionGroups.set(key, [])
    }
    suggestionGroups.get(key)!.push(suggestion)
  })
  
  // Collect IDs of duplicates to remove (keep the most recent)
  const duplicateIds: string[] = []
  suggestionGroups.forEach(group => {
    if (group.length > 1) {
      // Keep the first (most recent) and remove the rest
      const toRemove = group.slice(1)
      duplicateIds.push(...toRemove.map(s => s.id))
    }
  })
  
  // Remove duplicates in batches
  let duplicatesRemoved = 0
  if (duplicateIds.length > 0) {
    console.log(`🗑️ Removing ${duplicateIds.length} duplicate suggestions...`)
    
    // Remove in chunks of 1000 to avoid query limits
    for (let i = 0; i < duplicateIds.length; i += 1000) {
      const chunk = duplicateIds.slice(i, i + 1000)
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .in('id', chunk)
      
      if (error) {
        console.error('Error removing duplicates:', error)
        throw error
      }
      
      duplicatesRemoved += chunk.length
    }
  }
  
  console.log(`✅ Removed ${duplicatesRemoved} duplicate suggestions`)
  
  // Step 2: Remove very old suggestions (older than 30 days) that are still pending
  console.log('📅 Removing stale pending suggestions...')
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: staleCount } = await supabase
    .from('suggestions')
    .delete()
    .eq('status', 'pending')
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  const staleSuggestionsRemoved = staleCount || 0
  console.log(`🗑️ Removed ${staleSuggestionsRemoved} stale pending suggestions`)
  
  // Get final count
  const { count: finalCount } = await supabase
    .from('suggestions')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Final suggestions count: ${finalCount || 0}`)
  
  const stats: CleanupStats = {
    totalSuggestions: initialCount || 0,
    duplicatesRemoved,
    staleSuggestionsRemoved,
    finalCount: finalCount || 0
  }
  
  console.log('🎉 Cleanup completed!', stats)
  return stats
}

export async function getDocumentSuggestionStats(documentId: string) {
  console.log(`📋 Getting suggestion stats for document: ${documentId}`)
  
  const { data: suggestions, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('doc_id', documentId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching document suggestions:', error)
    return null
  }
  
  const pending = suggestions?.filter(s => s.status === 'pending') || []
  const accepted = suggestions?.filter(s => s.status === 'accepted') || []
  const rejected = suggestions?.filter(s => s.status === 'rejected') || []
  
  const stats = {
    total: suggestions?.length || 0,
    pending: pending.length,
    accepted: accepted.length,
    rejected: rejected.length,
    suggestions: suggestions || []
  }
  
  console.log('Document suggestion stats:', stats)
  return stats
} 