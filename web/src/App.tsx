import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Insights from './pages/Insights'
import './App.css'

// Landing page component
const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Wordwise 1.0
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">
            AI-First Writing Assistant
          </h1>
          <p className="mt-2 text-gray-500">
            Your universal writing companion with persona-specific features for sales representatives.
          </p>
          <div className="mt-6 space-y-3">
            <a
              href="/login"
              className="block w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-center transition-colors"
            >
              Get Started
            </a>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Real-time grammar, style, and AI-powered writing assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/editor/:docId" 
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/insights" 
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
