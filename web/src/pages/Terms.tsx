import { useNavigate } from 'react-router-dom'

const Terms = () => {
  const navigate = useNavigate()

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
                onClick={() => navigate('/contact')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: December 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Legal Agreement</h3>
            <p className="text-yellow-800">
              By using WordWise, you agree to these terms. Please read them carefully as they contain important 
              information about your rights and obligations.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using WordWise ("Service"), you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p className="text-gray-700">
              These Terms of Service ("Terms") govern your use of WordWise, operated by WordWise Inc. ("we," "us," or "our").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              WordWise is an AI-powered writing assistant that provides grammar checking, style suggestions, 
              vocabulary enhancement, and other writing improvement features. The service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Real-time writing analysis and suggestions</li>
              <li>Document creation and management</li>
              <li>Writing analytics and insights</li>
              <li>Sales-specific writing tools</li>
              <li>Collaboration features (Business plans)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To use certain features of WordWise, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Termination</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account if you violate these terms or engage 
              in any activity that we deem harmful to the service or other users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Permitted Use</h3>
            <p className="text-gray-700 mb-4">You may use WordWise for legitimate writing and business purposes, including:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Creating and editing documents</li>
              <li>Improving writing quality and style</li>
              <li>Collaborating with team members (Business plans)</li>
              <li>Analyzing writing performance</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Prohibited Use</h3>
            <p className="text-gray-700 mb-4">You agree not to use WordWise to:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Create illegal, harmful, or offensive content</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute spam, malware, or viruses</li>
              <li>Attempt to access unauthorized areas of the service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Resell or redistribute the service without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of all content you create using WordWise. By using our service, you grant us 
              a limited license to process your content solely for the purpose of providing our services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Intellectual Property</h3>
            <p className="text-gray-700">
              WordWise and all related technologies, algorithms, and content are owned by us and protected by 
              intellectual property laws. You may not copy, modify, or distribute our proprietary technology.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
            <p className="text-gray-700">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
              use, and protect your information. By using WordWise, you consent to our privacy practices as 
              described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Subscription and Billing</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Paid Plans</h3>
            <p className="text-gray-700 mb-4">
              WordWise offers both free and paid subscription plans. Paid plans provide additional features and capabilities.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Billing Terms</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable unless required by law</li>
              <li>We may change pricing with 30 days notice</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancellation</h3>
            <p className="text-gray-700">
              You may cancel your subscription at any time. Cancellations take effect at the end of your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Availability</h3>
            <p className="text-gray-700 mb-4">
              We strive to provide reliable service but cannot guarantee 100% uptime. We may temporarily suspend 
              service for maintenance, updates, or other technical reasons.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Accuracy</h3>
            <p className="text-gray-700 mb-4">
              While our AI provides helpful suggestions, it may not always be perfect. You are responsible for 
              reviewing and validating all suggestions before implementing them.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
            <p className="text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WORDWISE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold WordWise harmless from any claims, damages, or expenses arising 
              from your use of the service, violation of these terms, or infringement of any rights of others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. We will notify users of material changes by email 
              or through the service. Continued use of WordWise after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700">
              These Terms are governed by the laws of the State of California, United States, without regard 
              to conflict of law principles. Any disputes will be resolved in the courts of San Francisco, California.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@wordwise.ai<br />
                <strong>Address:</strong> WordWise Inc.<br />
                123 Writing Street<br />
                San Francisco, CA 94107<br />
                United States
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 mt-12">
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

export default Terms 