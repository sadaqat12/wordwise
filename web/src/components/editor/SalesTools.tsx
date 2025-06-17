import { useState } from 'react'
import { useAppStore } from '../../store'

interface SalesToolsProps {
  selectedText?: string
  onTextReplace?: (newText: string) => void
  className?: string
}

interface ProspectData {
  name: string
  company: string
  title: string
  industry: string
  pain_point: string
  recent_news: string
  mutual_connection: string
}

export default function SalesTools({ selectedText = '', onTextReplace, className = '' }: SalesToolsProps) {
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
  
  const handlePersonalize = async () => {
    if (!selectedText.trim()) {
      alert('Please select some text to personalize')
      return
    }
    
    setIsLoading(true)
    try {
      const personalized = await personalizeText(selectedText, prospectData)
      if (personalized) {
        setResult(personalized)
        if (onTextReplace) {
          onTextReplace(personalized)
        }
      }
    } catch (error) {
      console.error('Personalization error:', error)
      alert('Failed to personalize text. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleToneCheck = async () => {
    if (!selectedText.trim()) {
      alert('Please select some text to check tone')
      return
    }
    
    setIsLoading(true)
    try {
      const rewritten = await rewriteText(selectedText, 'tone', {
        target_tone: targetTone,
        brand_voice: brandVoice
      })
      if (rewritten) {
        setResult(rewritten)
        if (onTextReplace) {
          onTextReplace(rewritten)
        }
      }
    } catch (error) {
      console.error('Tone check error:', error)
      alert('Failed to adjust tone. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCtaAnalyze = async () => {
    if (!selectedText.trim()) {
      alert('Please select some text to analyze as CTA')
      return
    }
    
    setIsLoading(true)
    try {
      const rewritten = await rewriteText(selectedText, 'cta')
      if (rewritten) {
        setResult(rewritten)
        if (onTextReplace) {
          onTextReplace(rewritten)
        }
      }
    } catch (error) {
      console.error('CTA analysis error:', error)
      alert('Failed to analyze CTA. Please try again.')
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
      const response = await handleObjection(objectionText, objectionType, selectedText)
      if (response) {
        setResult(response)
      }
    } catch (error) {
      console.error('Objection handling error:', error)
      alert('Failed to generate objection response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4 ${className}`}>
      <h3 className="font-semibold text-blue-900 mb-3">Sales Tools</h3>
      
      {/* Tool Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsPersonalizeOpen(!isPersonalizeOpen)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          🎯 Personalize
        </button>
        
        <button
          onClick={() => setIsToneCheckerOpen(!isToneCheckerOpen)}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          🎨 Tone Check
        </button>
        
        <button
          onClick={() => setIsCtaAnalyzerOpen(!isCtaAnalyzerOpen)}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          📞 CTA Analyzer
        </button>
        
        <button
          onClick={() => setIsObjectionOpen(!isObjectionOpen)}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          💬 Objections
        </button>
      </div>
      
      {/* Personalize Panel */}
      {isPersonalizeOpen && (
        <div className="border border-blue-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-blue-900 mb-2">Personalize with Prospect Data</h4>
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
            {isLoading ? 'Personalizing...' : 'Personalize Selected Text'}
          </button>
        </div>
      )}
      
      {/* Tone Checker Panel */}
      {isToneCheckerOpen && (
        <div className="border border-purple-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-purple-900 mb-2">Brand & Tone Adjustment</h4>
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
            {isLoading ? 'Adjusting...' : 'Adjust Tone & Brand'}
          </button>
        </div>
      )}
      
      {/* CTA Analyzer Panel */}
      {isCtaAnalyzerOpen && (
        <div className="border border-green-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-green-900 mb-2">Call-to-Action Optimizer</h4>
          <p className="text-xs text-gray-600 mb-2">Select your CTA text and click to optimize for better conversion.</p>
          <button
            onClick={handleCtaAnalyze}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Optimizing...' : 'Optimize Selected CTA'}
          </button>
        </div>
      )}
      
      {/* Objection Handler Panel */}
      {isObjectionOpen && (
        <div className="border border-red-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-red-900 mb-2">Objection Response Generator</h4>
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
      
      {/* Results Display */}
      {result && (
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <h4 className="font-medium text-gray-900 mb-2">Result:</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded border">
            {result}
          </div>
          <button
            onClick={() => setResult('')}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear Result
          </button>
        </div>
      )}
      
      {/* Help Text */}
      <div className="text-xs text-gray-600 bg-white p-2 rounded border">
        <p><strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Select text in the editor before using Personalize, Tone Check, or CTA tools</li>
          <li>Fill in prospect data for better personalization results</li>
          <li>Use brand voice guidelines to maintain consistency</li>
          <li>Objection responses work without selecting text</li>
        </ul>
      </div>
    </div>
  )
} 