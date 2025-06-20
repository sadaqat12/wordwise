import { useState } from 'react'
import { useAppStore } from '../../store'

interface SalesToolsProps {
  content?: string // Full document content instead of selectedText
  onTextReplace?: (newText: string) => void
  className?: string
}

interface ProspectData extends Record<string, unknown> {
  name: string
  company: string
  title: string
  industry: string
  pain_point: string
  recent_news: string
  mutual_connection: string
}

export default function SalesTools({ content = '', onTextReplace, className = '' }: SalesToolsProps) {
  const { personalizeText, rewriteText, handleObjection } = useAppStore()
  
  // States for different tools
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false)
  const [isToneCheckerOpen, setIsToneCheckerOpen] = useState(false)
  const [isCtaAnalyzerOpen, setIsCtaAnalyzerOpen] = useState(false)
  const [isObjectionOpen, setIsObjectionOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  
  // Personalize tool state
  const [prospectData, setProspectData] = useState<ProspectData>({
    name: '',
    company: '',
    title: '',
    industry: '',
    pain_point: '',
    recent_news: '',
    mutual_connection: ''
  })
  
  // Tone checker state
  const [targetTone, setTargetTone] = useState('professional')
  const [brandVoice, setBrandVoice] = useState('')
  
  // Objection handler state
  const [objectionType, setObjectionType] = useState<string>('price')
  const [objectionText, setObjectionText] = useState('')
  
  // Helper function to close all panels
  const closeAllPanels = () => {
    setIsPersonalizeOpen(false)
    setIsToneCheckerOpen(false)
    setIsCtaAnalyzerOpen(false)
    setIsObjectionOpen(false)
  }

  // Helper function to toggle a specific panel (closing others)
  const togglePanel = (panelName: 'personalize' | 'tone' | 'cta' | 'objection') => {
    // Check if the clicked panel is already open
    const isAlreadyOpen = 
      (panelName === 'personalize' && isPersonalizeOpen) ||
      (panelName === 'tone' && isToneCheckerOpen) ||
      (panelName === 'cta' && isCtaAnalyzerOpen) ||
      (panelName === 'objection' && isObjectionOpen)
    
    // If already open, close all panels (toggle off)
    if (isAlreadyOpen) {
      closeAllPanels()
      return
    }
    
    // Otherwise, close all panels and open the selected one
    closeAllPanels()
    
    switch (panelName) {
      case 'personalize':
        setIsPersonalizeOpen(true)
        break
      case 'tone':
        setIsToneCheckerOpen(true)
        break
      case 'cta':
        setIsCtaAnalyzerOpen(true)
        break
      case 'objection':
        setIsObjectionOpen(true)
        break
    }
  }

  const handlePersonalize = async () => {
    if (!content.trim()) {
      alert('Please add some content to your document first')
      return
    }
    
    setIsLoading(true)
    try {
      const personalized = await personalizeText(content, prospectData)
      if (personalized && onTextReplace) {
        onTextReplace(personalized)
        closeAllPanels() // Close panels after successful application
      }
    } catch (error) {
      console.error('Personalization error:', error)
      alert('Failed to personalize text. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleToneCheck = async () => {
    if (!content.trim()) {
      alert('Please add some content to your document first')
      return
    }
    
    setIsLoading(true)
    try {
      const rewritten = await rewriteText(content, 'tone', {
        target_tone: targetTone,
        brand_voice: brandVoice
      })
      if (rewritten && onTextReplace) {
        onTextReplace(rewritten)
        closeAllPanels() // Close panels after successful application
      }
    } catch (error) {
      console.error('Tone check error:', error)
      alert('Failed to adjust tone. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCtaAnalyze = async () => {
    if (!content.trim()) {
      alert('Please add some content to your document first')
      return
    }
    
    setIsLoading(true)
    try {
      const rewritten = await rewriteText(content, 'cta')
      if (rewritten && onTextReplace) {
        onTextReplace(rewritten)
        closeAllPanels() // Close panels after successful application
      }
    } catch (error) {
      console.error('CTA analysis error:', error)
      alert('Failed to optimize CTAs. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleObjectionResponse = async () => {
    if (!objectionText.trim()) {
      alert('Please enter an objection to handle')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await handleObjection(objectionText, objectionType, content)
      if (response && onTextReplace) {
        onTextReplace(response)
        closeAllPanels() // Close panels after successful application
      }
    } catch (error) {
      console.error('Objection handling error:', error)
      alert('Failed to generate objection response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasContent = content.trim().length > 0
  const wordCount = hasContent ? content.split(/\s+/).filter(word => word.length > 0).length : 0

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-blue-900">Sales Tools</h3>
        {hasContent && (
          <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
            {wordCount} words ready
          </span>
        )}
      </div>
      
      {!hasContent && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>Start writing to unlock sales tools</p>
          <p className="text-xs mt-1">Tools will automatically work with your document content</p>
        </div>
      )}
      
      {/* Tool Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => togglePanel('personalize')}
          disabled={!hasContent}
          className={`px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            isPersonalizeOpen 
              ? 'bg-blue-800 hover:bg-blue-900' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          🎯 Personalize
        </button>
        
        <button
          onClick={() => togglePanel('tone')}
          disabled={!hasContent}
          className={`px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            isToneCheckerOpen 
              ? 'bg-purple-800 hover:bg-purple-900' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          🎨 Tone Check
        </button>
        
        <button
          onClick={() => togglePanel('cta')}
          disabled={!hasContent}
          className={`px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            isCtaAnalyzerOpen 
              ? 'bg-green-800 hover:bg-green-900' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          📞 CTA Optimizer
        </button>
        
        <button
          onClick={() => togglePanel('objection')}
          className={`px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
            isObjectionOpen 
              ? 'bg-red-800 hover:bg-red-900' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          💬 Objections
        </button>
      </div>
      
      {/* Personalize Panel */}
      {isPersonalizeOpen && (
        <div className="border border-blue-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-blue-900 mb-2">Personalize Entire Document</h4>
          <p className="text-xs text-gray-600 mb-2">Add prospect details to personalize your {wordCount}-word document</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input
              type="text"
              placeholder="Name"
              value={prospectData.name}
              onChange={(e) => setProspectData({...prospectData, name: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Company"
              value={prospectData.company}
              onChange={(e) => setProspectData({...prospectData, company: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Title"
              value={prospectData.title}
              onChange={(e) => setProspectData({...prospectData, title: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Industry"
              value={prospectData.industry}
              onChange={(e) => setProspectData({...prospectData, industry: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Pain Point"
              value={prospectData.pain_point}
              onChange={(e) => setProspectData({...prospectData, pain_point: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded col-span-2"
            />
          </div>
          <button
            onClick={handlePersonalize}
            disabled={isLoading}
            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Personalizing...' : 'Personalize Document'}
          </button>
        </div>
      )}
      
      {/* Tone Checker Panel */}
      {isToneCheckerOpen && (
        <div className="border border-purple-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-purple-900 mb-2">Adjust Document Tone & Brand</h4>
          <p className="text-xs text-gray-600 mb-2">Apply tone and brand adjustments to your entire {wordCount}-word document</p>
          <div className="space-y-2">
            <select
              value={targetTone}
              onChange={(e) => setTargetTone(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
              <option value="consultative">Consultative</option>
              <option value="casual">Casual</option>
            </select>
            <textarea
              placeholder="Brand voice guidelines (optional)"
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm h-16 resize-none"
            />
          </div>
          <button
            onClick={handleToneCheck}
            disabled={isLoading}
            className="mt-2 w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Adjusting...' : 'Adjust Document Tone'}
          </button>
        </div>
      )}
      
      {/* CTA Analyzer Panel */}
      {isCtaAnalyzerOpen && (
        <div className="border border-green-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-green-900 mb-2">Call-to-Action Optimizer</h4>
          <p className="text-xs text-gray-600 mb-2">Find and improve CTAs in your {wordCount}-word document</p>
          <button
            onClick={handleCtaAnalyze}
            disabled={isLoading}
            className="mt-2 w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Optimizing...' : 'Optimize CTAs'}
          </button>
        </div>
      )}
      
      {/* Objection Handler Panel */}
      {isObjectionOpen && (
        <div className="border border-red-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-red-900 mb-2">Objection Response Generator</h4>
          <p className="text-xs text-gray-600 mb-2">Replace document with contextual objection response based on your content</p>
          <div className="space-y-2">
            <select
              value={objectionType}
              onChange={(e) => setObjectionType(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="price">Price/Budget</option>
              <option value="timing">Timing/Schedule</option>
              <option value="authority">Authority/Decision Maker</option>
              <option value="need">Need/Urgency</option>
              <option value="competitor">Competitor/Alternative</option>
              <option value="trust">Trust/Credibility</option>
              <option value="custom">Custom/Other</option>
            </select>
            <textarea
              placeholder="Enter the objection you received..."
              value={objectionText}
              onChange={(e) => setObjectionText(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm h-16 resize-none"
            />
          </div>
          <button
            onClick={handleObjectionResponse}
            disabled={isLoading}
            className="mt-2 w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Generating...' : 'Generate Response'}
          </button>
        </div>
      )}
      
      {/* Results Display - Only for suggestions that aren't auto-applied */}
      {result && (
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-gray-900 mb-2">Suggestions:</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded border max-h-40 overflow-y-auto">
            {result}
          </div>
          <button
            onClick={() => setResult('')}
            className="mt-2 text-xs px-2 py-1 text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
          >
            Clear
          </button>
        </div>
      )}
      
      {/* Updated Help Text */}
      <div className="text-xs text-gray-600 bg-white p-2 rounded border">
        <p><strong>How it works:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Tools automatically apply changes to your entire document</li>
          <li>🎯 Personalize: Weaves prospect data throughout your content</li>
          <li>🎨 Tone Check: Adjusts the whole document's tone and brand voice</li>
          <li>📞 CTA Optimizer: Finds and improves existing calls-to-action</li>
          <li>💬 Objections: Automatically replaces document with contextual objection responses</li>
          <li>Use browser back/undo (Cmd+Z) to revert changes if needed</li>
        </ul>
      </div>
    </div>
  )
} 