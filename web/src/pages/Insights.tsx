import { useRequireAuth } from '../hooks/useAuth'

const Insights = () => {
  const isAuthenticated = useRequireAuth()

  if (!isAuthenticated) {
    return null // Will redirect via useRequireAuth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600 mt-2">
            Writing analytics and suggestion performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Suggestions Accepted
            </h3>
            <p className="text-3xl font-bold text-primary-600">--</p>
            <p className="text-sm text-gray-500 mt-2">Coming in Section 9</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Writing Quality Score
            </h3>
            <p className="text-3xl font-bold text-accent-600">--</p>
            <p className="text-sm text-gray-500 mt-2">Analytics pipeline TBD</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Documents Created
            </h3>
            <p className="text-3xl font-bold text-secondary-600">--</p>
            <p className="text-sm text-gray-500 mt-2">Real-time metrics</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500">
              Analytics dashboard will be implemented in Section 9
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights 