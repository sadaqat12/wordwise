import './App.css'

function App() {
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
          <div className="mt-4">
            <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
