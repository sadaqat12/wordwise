import { useState } from 'react'
import { useAppStore, supabase } from '../../store'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const { user, workspaces, setWorkspaces, setCurrentWorkspace } = useAppStore()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return

    setIsLoading(true)
    setError('')

    try {
      // First ensure the user exists in our custom users table
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'user'
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.warn('Could not upsert user, continuing anyway:', upsertError)
      }

      // Now create the workspace
      const { data, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          owner_id: user.id,
          brand_voice_json: {}
        })
        .select()
        .single()

      if (createError) throw createError

      // Update local state
      const updatedWorkspaces = [data, ...workspaces]
      setWorkspaces(updatedWorkspaces)
      setCurrentWorkspace(data)

      // Reset form and close modal
      setName('')
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to create workspace')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Workspace</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Name
              </label>
              <input
                id="workspace-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateWorkspaceModal 