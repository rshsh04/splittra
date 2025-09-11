"use client"
import Header from '@/components/header';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-700">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SplitIt, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">2. Service Description</h2>
            <p>
              SplitIt is an expense-sharing platform that allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage households for expense sharing</li>
              <li>Track and split expenses among household members</li>
              <li>Send and receive payment notifications</li>
              <li>Access expense analytics and reports</li>
              <li>Utilize premium features with a subscription</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">3. User Accounts</h2>
            <div className="space-y-2">
              <p>Users must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of their account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be at least 18 years old to use the service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">4. Premium Subscription</h2>
            <div className="space-y-2">
              <p>Premium features include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Advanced expense analytics</li>
                <li>Unlimited expense history</li>
                <li>Priority support</li>
                <li>Export capabilities</li>
              </ul>
              <p>Subscriptions auto-renew unless cancelled before the renewal date.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">5. User Responsibilities</h2>
            <p>Users agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit false or misleading expense information</li>
              <li>Use the service for any illegal purpose</li>
              <li>Share account credentials with others</li>
              <li>Attempt to access other users' accounts</li>
              <li>Interfere with the proper operation of the service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">6. Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to our service immediately, 
              without prior notice, for any breach of these Terms of Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any 
              material changes via email or through the application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">8. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact:{' '}
              <a href="mailto:support@splitit.com" className="text-blue-600 hover:text-blue-800">
                support@splitit.com
              </a>
            </p>
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500">
              Last updated: September 11, 2025
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
