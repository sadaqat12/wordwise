import { useNavigate } from 'react-router-dom'

const Privacy = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: December 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Our Commitment to Your Privacy</h3>
            <p className="text-blue-800">
              At WordWise, we take your privacy seriously. This policy explains how we collect, use, and protect 
              your personal information when you use our AI-powered writing assistant.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Name and email address when you create an account</li>
              <li>Billing information for paid subscriptions</li>
              <li>Profile information you choose to provide</li>
              <li>Communication preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Text content you write and edit in our application</li>
              <li>Documents you create, save, and organize</li>
              <li>Writing preferences and customizations</li>
              <li>Usage patterns and interaction data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Device information (browser, operating system)</li>
              <li>IP address and general location data</li>
              <li>Application performance and error logs</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Provision</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Provide AI-powered writing suggestions and corrections</li>
              <li>Save and sync your documents across devices</li>
              <li>Personalize your writing experience</li>
              <li>Process payments and manage subscriptions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Improvement</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Analyze usage patterns to improve our AI models</li>
              <li>Develop new features and functionality</li>
              <li>Fix bugs and optimize performance</li>
              <li>Conduct research and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Communication</h3>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Send important service updates and notifications</li>
              <li>Respond to your support requests and inquiries</li>
              <li>Share product updates and new features (with your consent)</li>
              <li>Provide customer support and assistance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">We Do NOT:</h3>
              <ul className="list-disc pl-6 text-green-800">
                <li>Sell your personal information to third parties</li>
                <li>Share your writing content with other users</li>
                <li>Use your content for advertising purposes</li>
                <li>Train our AI models on your private documents</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Limited Sharing</h3>
            <p className="text-gray-700 mb-4">We may share information only in these specific circumstances:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Service Providers:</strong> Trusted partners who help us operate our service (hosting, payment processing, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale</li>
              <li><strong>Your Consent:</strong> When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using AES-256 encryption</li>
              <li><strong>Access Controls:</strong> Limited employee access on a need-to-know basis</li>
              <li><strong>Regular Audits:</strong> Ongoing security assessments and vulnerability testing</li>
              <li><strong>Secure Infrastructure:</strong> Enterprise-grade hosting with multiple security layers</li>
              <li><strong>Privacy by Design:</strong> Security considerations built into every feature</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Controls</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Control</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Access and update your personal information</li>
              <li>Download your documents and data</li>
              <li>Delete your account and associated data</li>
              <li>Manage communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Rights</h3>
            <p className="text-gray-700 mb-4">Depending on your location, you may have additional rights including:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Right to know what personal information we collect</li>
              <li>Right to request deletion of your personal information</li>
              <li>Right to correct inaccurate personal information</li>
              <li>Right to opt-out of certain data processing activities</li>
              <li>Right to data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information only as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Account Information:</strong> Until you delete your account</li>
              <li><strong>Documents:</strong> Until you delete them or close your account</li>
              <li><strong>Usage Data:</strong> Aggregated data for up to 2 years for service improvement</li>
              <li><strong>Billing Information:</strong> As required by law for tax and accounting purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
            <p className="text-gray-700">
              WordWise operates globally. Your information may be transferred to and processed in countries other than 
              your own. We ensure appropriate safeguards are in place to protect your information in accordance with 
              this privacy policy and applicable data protection laws, including GDPR for European users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700">
              WordWise is not intended for use by children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If we become aware that we have collected personal 
              information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We will notify you of any material changes by 
              posting the new policy on this page and updating the "Last updated" date. For significant changes, 
              we may also send you an email notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this privacy policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@wordwise.ai<br />
                <strong>Address:</strong> WordWise Privacy Team<br />
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

export default Privacy 