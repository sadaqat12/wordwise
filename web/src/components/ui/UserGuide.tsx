import React, { useState } from 'react'

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    { id: 'getting-started', title: '🚀 Getting Started', icon: '🚀' },
    { id: 'editor', title: '✍️ Writing & Editing', icon: '✍️' },
    { id: 'ai-assistance', title: '🤖 AI Writing Assistant', icon: '🤖' },
    { id: 'sales-tools', title: '💼 Sales Tools', icon: '💼' },
    { id: 'management', title: '📁 Document Management', icon: '📁' },
    { id: 'analytics', title: '📊 Analytics & Insights', icon: '📊' },
    { id: 'tips', title: '💡 Pro Tips', icon: '💡' }
  ]

  if (!isOpen) return null

  const renderSection = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Welcome to WordWise!</h3>
              <p className="text-gray-700 mb-4">
                WordWise is your AI-powered writing assistant that helps you create better content faster. 
                Whether you're writing emails, documents, or sales communications, WordWise provides 
                real-time suggestions and specialized tools to improve your writing.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏢 Workspaces</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Create workspaces to organize your documents by project, team, or purpose</li>
                <li>Each workspace can have its own brand voice and settings</li>
                <li>Switch between workspaces using the dropdown in the header</li>
                <li>Click "New Workspace" to create additional workspaces</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📄 Creating Documents</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Click "New Document" on your dashboard to start writing</li>
                <li>Documents are automatically saved as you type</li>
                <li>All documents are organized within your selected workspace</li>
                <li>Access your documents anytime from the dashboard</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Two-Layer Approach</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Universal Layer:</strong> Grammar, spelling, style improvements for any writing</li>
                <li><strong>Sales Layer:</strong> Specialized tools for sales professionals (personalization, tone, CTAs)</li>
                <li>All features work together to enhance your writing quality</li>
              </ul>
            </div>
          </div>
        )

      case 'editor':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Writing & Editing Features</h3>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎨 Rich Text Formatting</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Text Styles:</strong> Bold, italic, underline, strikethrough</li>
                <li><strong>Structure:</strong> Headings (H1, H2, H3), paragraphs, quotes</li>
                <li><strong>Lists:</strong> Bulleted and numbered lists</li>
                <li><strong>Shortcuts:</strong> Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)</li>
                <li><strong>Undo/Redo:</strong> Use toolbar buttons or Ctrl+Z / Ctrl+Y</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎤 Voice Input</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Click the microphone button in the toolbar to start voice input</li>
                <li>Use <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Shift+V</kbd> keyboard shortcut</li>
                <li>Speak naturally - your speech will be converted to text</li>
                <li>Voice input works in any part of your document</li>
                <li>Perfect for dictating long passages or when typing isn't convenient</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">⌨️ Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Formatting:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+B</kbd> Bold</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+I</kbd> Italic</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+U</kbd> Underline</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">Actions:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Z</kbd> Undo</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Y</kbd> Redo</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Shift+V</kbd> Voice</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'ai-assistance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Writing Assistant</h3>
              <p className="text-gray-700 mb-4">
                WordWise automatically analyzes your writing and provides real-time suggestions 
                to improve grammar, style, vocabulary, and clarity.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">✨ Suggestion Types</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-red-200 rounded mt-1"></div>
                  <div>
                    <p className="font-medium text-red-800">Grammar</p>
                    <p className="text-sm text-gray-600">Fixes sentence structure, verb tense, punctuation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-yellow-200 rounded mt-1"></div>
                  <div>
                    <p className="font-medium text-yellow-800">Spelling</p>
                    <p className="text-sm text-gray-600">Corrects misspelled words and typos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-blue-200 rounded mt-1"></div>
                  <div>
                    <p className="font-medium text-blue-800">Style</p>
                    <p className="text-sm text-gray-600">Improves clarity, conciseness, and readability</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-purple-200 rounded mt-1"></div>
                  <div>
                    <p className="font-medium text-purple-800">Vocabulary</p>
                    <p className="text-sm text-gray-600">Suggests better word choices and alternatives</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 How to Use Suggestions</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Highlighted text shows areas with suggestions</li>
                <li>Click on highlighted text to see the suggestion popup</li>
                <li>Click "Accept" to apply the suggestion automatically</li>
                <li>Click "Reject" to dismiss the suggestion</li>
                <li>Suggestions appear in the sidebar for easy review</li>
                <li>Each suggestion shows a confidence score</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">⚡ Performance</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>AI analysis typically completes in under 2 seconds</li>
                <li>Suggestions update automatically as you type</li>
                <li>Works on documents of any length</li>
                <li>All processing happens securely in the cloud</li>
              </ul>
            </div>
          </div>
        )

      case 'sales-tools':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sales Tools</h3>
              <p className="text-gray-700 mb-4">
                Specialized tools designed for sales professionals to create more effective, 
                personalized communications that drive better outcomes.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Personalization Tool</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Add prospect information (name, company, title, industry, pain points)</li>
                <li>AI automatically weaves this data throughout your entire document</li>
                <li>Creates natural, contextual references that feel personally written</li>
                <li>Perfect for cold emails, proposals, and follow-up communications</li>
                <li><strong>Tip:</strong> More prospect data = better personalization</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎨 Tone & Brand Voice</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Choose from preset tones: Professional, Friendly, Urgent, Consultative, Casual</li>
                <li>Add custom brand voice guidelines for consistent messaging</li>
                <li>AI adjusts your entire document to match the selected tone</li>
                <li>Maintains your message while improving the delivery style</li>
                <li>Great for ensuring consistency across team communications</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📞 CTA Optimizer</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Automatically identifies calls-to-action in your document</li>
                <li>Suggests improvements for clarity and impact</li>
                <li>Optimizes for specific actions (meetings, demos, replies)</li>
                <li>Improves response rates with proven CTA patterns</li>
                <li>Works on any document length or format</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">💬 Objection Handler</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Generate responses to common sales objections</li>
                <li>Categories: Price, Timing, Authority, Need, Competitor, Trust</li>
                <li>Uses your document content as context for relevant responses</li>
                <li>Creates natural, non-pushy objection handling</li>
                <li>Replaces your document with a complete response</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Outcome Tracking</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Track your document's journey: Draft → Sent → Opened → Replied → Meeting Booked</li>
                <li>Mark documents as "Sent" when you email them</li>
                <li>Update status when prospects open, reply, or book meetings</li>
                <li>View performance metrics in the Analytics dashboard</li>
                <li>Helps measure the effectiveness of your writing improvements</li>
              </ul>
            </div>
          </div>
        )

      case 'management':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Document Management</h3>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📁 Dashboard Overview</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>View all your documents in a card-based layout</li>
                <li>See document status, last updated date, and writing metrics</li>
                <li>Documents show outcome status (Draft, Sent, Opened, etc.)</li>
                <li>Quick access to download and delete functions</li>
                <li>Writing scores and word counts at a glance</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📝 Document Actions</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Create:</strong> Click "New Document" to start writing</li>
                <li><strong>Edit:</strong> Click any document card to open the editor</li>
                <li><strong>Download:</strong> Hover over document cards to reveal download button</li>
                <li><strong>Delete:</strong> Hover over document cards to reveal delete button (permanent!)</li>
                <li><strong>Status Updates:</strong> Use outcome tracking buttons to update document status</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏢 Workspace Management</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Create multiple workspaces for different projects or teams</li>
                <li>Each workspace maintains its own document collection</li>
                <li>Set brand voice guidelines per workspace</li>
                <li>Switch between workspaces using the header dropdown</li>
                <li>Organize your work by client, campaign, or purpose</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">💾 Auto-Save</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>All changes are automatically saved as you type</li>
                <li>No need to manually save - your work is always protected</li>
                <li>Documents sync across all your devices</li>
                <li>Edit history is preserved for undo/redo functionality</li>
              </ul>
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-700 mb-4">
                Track your writing performance and see how AI suggestions improve your content quality and sales outcomes.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Writing Metrics</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Text Quality Score:</strong> Overall writing quality rating (0-100)</li>
                <li><strong>Word Count:</strong> Document length and reading time estimates</li>
                <li><strong>Suggestion Stats:</strong> Number of suggestions found and accepted</li>
                <li><strong>Improvement Areas:</strong> Grammar, style, vocabulary breakdown</li>
                <li><strong>Confidence Scores:</strong> AI confidence in each suggestion</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Sales Performance</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Outcome Funnel:</strong> Track document journey from sent to meeting booked</li>
                <li><strong>Response Rates:</strong> Percentage of sent documents that get replies</li>
                <li><strong>Conversion Stats:</strong> How many conversations lead to meetings</li>
                <li><strong>Tool Usage:</strong> Which sales tools are most effective</li>
                <li><strong>Performance Trends:</strong> Improvement over time</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📈 Dashboard Features</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Quick overview cards showing key metrics</li>
                <li>Document-level performance summaries</li>
                <li>Workspace-wide analytics and trends</li>
                <li>Click "Analytics" in the header to access full dashboard</li>
                <li>Export data for external reporting (coming soon)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔍 Using Insights</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Identify patterns in successful documents</li>
                <li>See which writing improvements have the biggest impact</li>
                <li>Optimize your sales communication strategy</li>
                <li>Track ROI of using AI writing assistance</li>
                <li>Share performance data with your team</li>
              </ul>
            </div>
          </div>
        )

      case 'tips':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pro Tips & Best Practices</h3>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">✍️ Writing Tips</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Start with your core message:</strong> Write your main point first, then use AI to improve it</li>
                <li><strong>Accept high-confidence suggestions:</strong> Suggestions with 90%+ confidence are usually excellent</li>
                <li><strong>Review rejected suggestions:</strong> Sometimes dismissed suggestions offer valuable insights</li>
                <li><strong>Use voice input for brainstorming:</strong> Speak your ideas, then refine with AI assistance</li>
                <li><strong>Combine multiple tools:</strong> Use personalization + tone adjustment for maximum impact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Sales Effectiveness</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Personalize first:</strong> Add prospect data before other optimizations</li>
                <li><strong>Test different tones:</strong> Try professional vs. friendly for different prospects</li>
                <li><strong>Strong CTAs win:</strong> Always end with a clear, specific call-to-action</li>
                <li><strong>Track everything:</strong> Use outcome tracking to measure what works</li>
                <li><strong>Iterate based on results:</strong> Analyze successful patterns and repeat them</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">⚡ Productivity Hacks</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Template approach:</strong> Create base templates, then personalize for each prospect</li>
                <li><strong>Batch processing:</strong> Write multiple documents, then run sales tools on all</li>
                <li><strong>Keyboard shortcuts:</strong> Learn Ctrl+Shift+V for quick voice input</li>
                <li><strong>Workspace organization:</strong> Separate workspaces by campaign or client</li>
                <li><strong>Quick iterations:</strong> Use Ctrl+Z to easily test different versions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎨 Quality Optimization</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Aim for 85+ text scores:</strong> This indicates professional-quality writing</li>
                <li><strong>Balance length and clarity:</strong> Longer isn't always better</li>
                <li><strong>Review suggestions sidebar:</strong> Don't miss important improvements</li>
                <li><strong>Brand consistency:</strong> Set workspace brand voice for consistent tone</li>
                <li><strong>Regular reviews:</strong> Check analytics to see improvement trends</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🆘 Need Help?</h4>
              <p className="text-blue-800 text-sm">
                If you have questions or need assistance, check our FAQ page or contact support. 
                WordWise is designed to be intuitive, but we're here to help you get the most out of every feature.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-500">
                <span className="text-lg font-bold text-white">W</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">WordWise</h2>
                <p className="text-sm text-gray-600">User Guide</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeSection === section.id
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{section.icon}</span>
                      <span>{section.title}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {sections.find(s => s.id === activeSection)?.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  )
} 