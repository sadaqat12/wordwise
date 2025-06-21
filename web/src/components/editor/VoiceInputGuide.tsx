import { useState } from 'react'

interface VoiceInputGuideProps {
  isOpen: boolean
  onClose: () => void
}

export default function VoiceInputGuide({ isOpen, onClose }: VoiceInputGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "🎤 Voice Input Feature",
      content: (
        <div>
          <p className="mb-4">WordWise now supports speech-to-text! You can dictate your documents instead of typing.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Benefits:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Faster content creation</li>
              <li>• More natural writing flow</li>
              <li>• Accessibility support</li>
              <li>• Perfect for brainstorming</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "🚀 Getting Started",
      content: (
        <div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Find the Voice Button</h4>
                <p className="text-sm text-gray-600">Look for the microphone icon in the editor toolbar</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Allow Microphone Access</h4>
                <p className="text-sm text-gray-600">Click "Allow" when your browser asks for microphone permission</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Start Speaking</h4>
                <p className="text-sm text-gray-600">Click the microphone and speak clearly into your device</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "⚡ Pro Tips",
      content: (
        <div>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">For Best Results:</h4>
              <ul className="text-green-700 text-sm space-y-2">
                <li>• Speak at a normal pace - not too fast or slow</li>
                <li>• Use a quiet environment when possible</li>
                <li>• Position your microphone 6-12 inches away</li>
                <li>• Pause briefly between sentences</li>
                <li>• Say punctuation: "period", "comma", "question mark"</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Keyboard Shortcuts:</h4>
              <p className="text-yellow-700 text-sm">
                Press <kbd className="px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-xs">Ctrl+M</kbd> to toggle voice input on/off
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🌍 Language Support",
      content: (
        <div>
          <p className="mb-4">Voice input supports multiple languages. Use the language dropdown next to the microphone button.</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Supported Languages:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>🇺🇸 English (US)</li>
                <li>🇬🇧 English (UK)</li>
                <li>🇪🇸 Spanish</li>
                <li>🇫🇷 French</li>
                <li>🇩🇪 German</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Also Available:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>🇮🇹 Italian</li>
                <li>🇵🇹 Portuguese</li>
                <li>🇯🇵 Japanese</li>
                <li>🇰🇷 Korean</li>
                <li>🇨🇳 Chinese</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🛠️ Troubleshooting",
      content: (
        <div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-red-600 mb-2">Common Issues & Solutions:</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-red-300 pl-4">
                  <p className="font-medium text-sm">Microphone not working?</p>
                  <p className="text-sm text-gray-600">Check browser permissions, try refreshing the page, or use Chrome/Edge for best support.</p>
                </div>
                <div className="border-l-4 border-yellow-300 pl-4">
                  <p className="font-medium text-sm">Text not appearing?</p>
                  <p className="text-sm text-gray-600">Make sure you've clicked in the editor first, speak clearly, and wait for the red recording indicator.</p>
                </div>
                <div className="border-l-4 border-blue-300 pl-4">
                  <p className="font-medium text-sm">Poor accuracy?</p>
                  <p className="text-sm text-gray-600">Try a quieter environment, speak more slowly, or switch to a different language if available.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {steps[currentStep].title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            {steps[currentStep].content}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full mx-1 transition-colors ${
                  index === currentStep ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Get Started!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 