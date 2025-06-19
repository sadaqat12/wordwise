import { useEffect, useState, useCallback } from 'react'
import { useAppStore, supabase } from '../store'

export function useDocument(docId: string) {
  const { 
    currentDocument, 
    setCurrentDocument, 
    updateDocument, 
    setContent
  } = useAppStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load document on mount or when docId changes
  useEffect(() => {
    let mounted = true

    const loadDocument = async () => {
      if (!docId) {
        setError('No document ID provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (mounted) {
          setCurrentDocument(data)
          setContent(data.content)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load document')
          setIsLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      mounted = false
    }
  }, [docId, setCurrentDocument, setContent])

  // Save document content
  const saveDocument = useCallback(async (content: string) => {
    if (!currentDocument) {
      console.error('No current document to save')
      return false
    }

    try {
      const success = await updateDocument(currentDocument.id, { 
        content,
        updated_at: new Date().toISOString()
      })
      return success
    } catch (error) {
      console.error('Error saving document:', error)
      return false
    }
  }, [currentDocument, updateDocument])

  return {
    document: currentDocument,
    isLoading,
    error,
    saveDocument
  }
} 