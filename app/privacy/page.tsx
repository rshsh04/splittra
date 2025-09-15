"use client"
import Header from '@/components/header';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-700">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">1. Introduction</h2>
            <p>
              Welcome to SplitIt. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our 
              expense-sharing platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">2. Information We Collect</h2>
            <div className="space-y-2">
              <p>We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email address)</li>
                <li>Profile pictures</li>
                <li>Household and group information</li>
                <li>Expense data and payment information</li>
                <li>Usage data and preferences</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">3. How We Use Your Information</h2>
            <div className="space-y-2">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Facilitate expense sharing and payments between users</li>
                <li>Manage household memberships and invitations</li>
                <li>Provide expense analytics and reports</li>
                <li>Send notifications about pending payments and updates</li>
                <li>Improve our services and user experience</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">4. Data Storage and Security</h2>
            <p>
              We use Appwrite as our backend service provider to store and process your data. All data is 
              encrypted in transit and at rest. We implement appropriate security measures to protect against 
              unauthorized access, alteration, disclosure, or destruction of your information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">5. Premium Features</h2>
            <p>
              For users who subscribe to our premium features, we collect additional information related to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription status and duration</li>
              <li>Advanced analytics preferences</li>
              <li>Extended expense history</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your expense data</li>
              <li>Opt-out of non-essential communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
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
