import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FAQ = () => {
  const navigate = useNavigate()
  const [openItems, setOpenItems] = useState<number[]>([0]) // First item open by default

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const faqs = [
    {
      question: "What is WordWise and how does it work?",
      answer: "WordWise is an AI-powered writing assistant that helps you write better content. It analyzes your text in real-time and provides suggestions for grammar, spelling, style, and vocabulary improvements. Simply type in our editor and get instant feedback to enhance your writing quality."
    },
    {
      question: "Is WordWise free to use?",
      answer: "Yes! WordWise offers a free plan that includes 5 documents per month with basic grammar, spelling, and style suggestions. For unlimited documents and advanced features, we offer Pro and Business plans with 14-day free trials."
    },
    {
      question: "How accurate are WordWise's suggestions?",
      answer: "WordWise uses advanced AI models trained on millions of text samples to provide highly accurate suggestions. Our grammar and spelling checks achieve over 95% accuracy, while style suggestions are contextually relevant to your writing goals."
    },
    {
      question: "Can I use WordWise for different types of writing?",
      answer: "Absolutely! WordWise supports various writing styles including business emails, academic papers, blog posts, sales copy, and creative writing. Our sales-specific features are perfect for professionals in sales and marketing."
    },
    {
      question: "How is WordWise different from other writing assistants?",
      answer: "WordWise combines universal writing support with persona-specific features, particularly for sales professionals. We offer specialized tools like text personalization, objection handling, and CTA optimization that other assistants don't provide."
    },
    {
      question: "Is my data secure with WordWise?",
      answer: "Yes, we take data security seriously. All your documents are encrypted both in transit and at rest. We don't share your content with third parties, and you can delete your data at any time. We're GDPR compliant and follow industry-standard security practices."
    },
    {
      question: "Can I collaborate with my team on WordWise?",
      answer: "Team collaboration is available with our Business plan. You can create shared workspaces, collaborate on documents, and maintain consistent brand voice across your organization."
    },
    {
      question: "Does WordWise work offline?",
      answer: "WordWise is a web-based application that requires an internet connection to provide real-time AI suggestions. However, you can continue writing offline, and suggestions will appear once you're back online."
    },
    {
      question: "What languages does WordWise support?",
      answer: "Currently, WordWise supports English with plans to expand to other languages. Our AI models are specifically trained for English grammar, style, and vocabulary to provide the most accurate suggestions."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll continue to have access to paid features until the end of your current billing period."
    },
    {
      question: "Can I export my documents from WordWise?",
      answer: "Yes! You can download your documents in various formats including plain text, and we're working on adding more export options like PDF and Word documents."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, we provide customer support through email for all users. Pro users get priority support, and Business users get dedicated support with faster response times."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary-500">
                <span className="text-xl font-bold text-white">W</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">WordWise</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-purple-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about WordWise and how it can help improve your writing.
          </p>
          <div className="bg-white p-4 rounded-lg shadow-sm max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search FAQ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openItems.includes(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Our support team is here to help you get the most out of WordWise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Try WordWise Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-500">
                  <span className="text-lg font-bold text-white">W</span>
                </div>
                <h3 className="text-xl font-bold text-white">WordWise</h3>
              </div>
              <p className="text-gray-400 mb-4">
                The AI-powered writing assistant that helps you write better, faster, and with more confidence.
              </p>
              <p className="text-gray-500 text-sm">
                © 2024 WordWise. All rights reserved.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/faq')} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms</button></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default FAQ 