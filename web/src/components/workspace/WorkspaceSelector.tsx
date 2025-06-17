import { useState } from 'react'
import { useAppStore } from '../../store'

const WorkspaceSelector = () => {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentWorkspace) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{currentWorkspace.name}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setCurrentWorkspace(workspace)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  workspace.id === currentWorkspace.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{workspace.name}</div>
                {workspace.brand_voice_json && Object.keys(workspace.brand_voice_json).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">Custom brand voice</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceSelector 