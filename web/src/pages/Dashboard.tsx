import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequireAuth } from '../hooks/useAuth'
import { useAppStore, supabase } from '../store'
import WorkspaceSelector from '../components/workspace/WorkspaceSelector'
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal'

const Dashboard = () => {
  const isAuthenticated = useRequireAuth()
  const navigate = useNavigate()
  const {
    user,
    currentWorkspace,
    workspaces,
    documents,
    setWorkspaces,
    setDocuments,
    setCurrentWorkspace,
    createDocument,
    signOut
  } = useAppStore()

  console.log('Dashboard render - isAuthenticated:', isAuthenticated, 'user:', user?.email)

  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) return

         const loadWorkspaces = async () => {
       try {
         const { data: workspacesData, error: workspacesError } = await supabase
           .from('workspaces')
           .select('*')
           .eq('owner_id', user.id)
           .order('created_at', { ascending: false })

         if (workspacesError) throw workspacesError

         setWorkspaces(workspacesData || [])

         // Set current workspace if none selected
         if (!currentWorkspace && workspacesData?.length > 0) {
           setCurrentWorkspace(workspacesData[0])
         }
       } catch (error) {
         console.error('Error loading workspaces:', error)
       } finally {
         setIsLoading(false)
       }
     }

    loadWorkspaces()
  }, [isAuthenticated, user, setWorkspaces, setCurrentWorkspace, currentWorkspace])

  useEffect(() => {
    if (!currentWorkspace) return

         const loadDocuments = async () => {
       try {
         const { data: documentsData, error: documentsError } = await supabase
           .from('documents')
           .select('*')
           .eq('workspace_id', currentWorkspace.id)
           .order('updated_at', { ascending: false })

         if (documentsError) throw documentsError

         setDocuments(documentsData || [])
       } catch (error) {
         console.error('Error loading documents:', error)
       }
     }

    loadDocuments()
  }, [currentWorkspace, setDocuments])

  const handleCreateDocument = async () => {
    if (!currentWorkspace) return

    const title = `Untitled Document ${documents.length + 1}`
    const newDoc = await createDocument(title, currentWorkspace.id)
    
    if (newDoc) {
      navigate(`/editor/${newDoc.id}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!isAuthenticated) {
    return null // Will redirect via useRequireAuth
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show workspace creation if no workspaces exist
  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with logout */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-500">
                  <span className="text-lg font-bold text-white">W</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Wordwise</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome content */}
        <div className="flex items-center justify-center py-20">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-primary-500 mb-4">
                <span className="text-2xl font-bold text-white">W</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Wordwise!
              </h2>
              <p className="text-gray-600 mb-6">
                Let's start by creating your first workspace.
              </p>
              <button
                onClick={() => setIsCreateWorkspaceOpen(true)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Create Workspace
              </button>
            </div>
          </div>
          <CreateWorkspaceModal
            isOpen={isCreateWorkspaceOpen}
            onClose={() => setIsCreateWorkspaceOpen(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-500">
                <span className="text-lg font-bold text-white">W</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Wordwise</h1>
              <WorkspaceSelector />
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
            <p className="text-gray-600">
              {currentWorkspace?.name || 'Select a workspace to get started'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setIsCreateWorkspaceOpen(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              New Workspace
            </button>
            <button
              onClick={handleCreateDocument}
              disabled={!currentWorkspace}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              New Document
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">Create your first document to start writing with AI assistance.</p>
            <button
              onClick={handleCreateDocument}
              disabled={!currentWorkspace}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-medium text-gray-900 mb-2 truncate">{doc.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </p>
                <div className="text-xs text-gray-400">
                  {doc.content ? `${doc.content.split(' ').length} words` : 'Empty document'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
      />
    </div>
  )
}

export default Dashboard 