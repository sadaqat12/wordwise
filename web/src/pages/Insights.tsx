import { useRequireAuth } from '../hooks/useAuth'
import { useAppStore, supabase } from '../store'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PerformancePanel from '../components/analytics/PerformancePanel'
import { calculateWritingMetrics } from '../utils/writingAnalytics'
import type { WritingMetrics } from '../utils/writingAnalytics'
import type { Suggestion } from '../store'
import { cleanupSuggestionDatabase, type CleanupStats } from '../utils/suggestionCleanup'

const Insights = () => {
  const isAuthenticated = useRequireAuth()
  const navigate = useNavigate()
  const { documents, currentWorkspace } = useAppStore()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<WritingMetrics | null>(null)
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null)

  // Get the selected document or most recent document
  const selectedDocument = selectedDocumentId 
    ? documents.find(doc => doc.id === selectedDocumentId)
    : documents[0] // Most recent document

  // Fetch all suggestions for documents in the workspace
  useEffect(() => {
    const fetchAllSuggestions = async () => {
      if (documents.length === 0) {
        setAllSuggestions([])
        setIsLoadingSuggestions(false)
        return
      }

      try {
        const documentIds = documents.map(doc => doc.id)
        const { data: suggestionsData, error } = await supabase
          .from('suggestions')
          .select('*')
          .in('doc_id', documentIds)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching suggestions:', error)
          setAllSuggestions([])
        } else {
          setAllSuggestions(suggestionsData || [])
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setAllSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    fetchAllSuggestions()
  }, [documents])

  // Calculate metrics when document changes
  useEffect(() => {
    if (selectedDocument?.content) {
      // Always use database suggestions for consistent analytics
      // This ensures the score matches what was actually saved in the database
      const documentSuggestions = allSuggestions.filter(s => 
        s.doc_id === selectedDocument.id && s.status === 'pending'
      )
      
      const calculatedMetrics = calculateWritingMetrics(
        selectedDocument.content, 
        documentSuggestions.length
      )
      setMetrics(calculatedMetrics)
    } else {
      setMetrics(null)
    }
  }, [selectedDocument, allSuggestions])

  const handleCleanupDatabase = async () => {
    if (!confirm('This will remove duplicate and stale suggestions from your database. This action cannot be undone. Continue?')) {
      return
    }

    setIsCleaningUp(true)
    try {
      const stats = await cleanupSuggestionDatabase()
      setCleanupStats(stats)
      // Reload suggestions after cleanup
      const documentIds = documents.map(doc => doc.id)
      const { data: suggestionsData } = await supabase
        .from('suggestions')
        .select('*')
        .in('doc_id', documentIds)
        .order('created_at', { ascending: false })
      
      setAllSuggestions(suggestionsData || [])
      
      alert(`Cleanup completed! Removed ${stats.duplicatesRemoved} duplicates and ${stats.staleSuggestionsRemoved} stale suggestions. Database now has ${stats.finalCount} suggestions (was ${stats.totalSuggestions}).`)
    } catch (error) {
      console.error('Cleanup failed:', error)
      alert('Cleanup failed. Please try again or contact support.')
    } finally {
      setIsCleaningUp(false)
    }
  }

  if (!isAuthenticated) {
    return null // Will redirect via useRequireAuth
  }

  // Calculate overall statistics
  const totalDocuments = documents.length
  const totalSuggestions = allSuggestions.length
  const acceptedSuggestions = allSuggestions.filter(s => s.status === 'accepted').length
  const acceptanceRate = totalSuggestions > 0 ? Math.round((acceptedSuggestions / totalSuggestions) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
              <p className="text-gray-600 mt-2">
                Writing analytics and performance metrics for your documents
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCleanupDatabase}
                disabled={isCleaningUp}
                className="inline-flex items-center px-4 py-2 border border-orange-300 shadow-sm text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isCleaningUp ? 'Cleaning...' : 'Clean Database'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3" />
                </svg>
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Documents
            </h3>
            <p className="text-3xl font-bold text-blue-600">{totalDocuments}</p>
            <p className="text-sm text-gray-500 mt-2">
              {currentWorkspace?.name || 'Current workspace'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Suggestions Made
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {isLoadingSuggestions ? (
                <span className="inline-block animate-pulse">--</span>
              ) : (
                totalSuggestions
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">AI recommendations</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Suggestions Accepted
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {isLoadingSuggestions ? (
                <span className="inline-block animate-pulse">--</span>
              ) : (
                acceptedSuggestions
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {isLoadingSuggestions ? '--' : acceptanceRate}% acceptance rate
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Writing Score
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {metrics?.textScore || '--'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Current document quality</p>
          </div>
        </div>

        {/* Document Selector */}
        {documents.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analyze Document:
            </label>
            <select
              value={selectedDocumentId || ''}
              onChange={(e) => setSelectedDocumentId(e.target.value || null)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Most Recent Document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({new Date(doc.updated_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Performance Analytics */}
        {metrics && selectedDocument ? (
          <PerformancePanel 
            metrics={metrics} 
            text={selectedDocument.content}
            suggestionsCount={allSuggestions.filter(s => s.doc_id === selectedDocument.id && s.status === 'pending').length}
          />
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first document to see detailed writing analytics and performance metrics.
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Document
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content to analyze</h3>
              <p className="text-gray-500">
                The selected document is empty. Add some content to see writing analytics.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Insights 