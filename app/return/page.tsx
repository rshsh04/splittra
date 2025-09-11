"use client"
import Header from '@/components/header';

export default function ReturnPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Return & Refund Policy</h1>
        
        <div className="space-y-8 text-gray-700">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">1. Premium Subscription Refunds</h2>
            <p>
              As SplitIt is primarily a digital service, we handle refunds for our Premium subscriptions 
              according to the following guidelines:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests must be made within 14 days of purchase</li>
              <li>First-time Premium subscribers are eligible for a full refund if unsatisfied</li>
              <li>Refunds are processed through the original payment method</li>
              <li>Processing time may take 5-10 business days</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">2. Eligibility for Refunds</h2>
            <div className="space-y-2">
              <p>Refunds may be considered in the following cases:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Technical issues preventing access to Premium features</li>
                <li>Accidental or duplicate subscription purchases</li>
                <li>Service unavailability during the subscription period</li>
                <li>Billing errors or unauthorized charges</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">3. Non-Refundable Items</h2>
            <p>The following are not eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Partially used subscription periods</li>
              <li>Subscriptions active for more than 14 days</li>
              <li>Subscriptions cancelled after the renewal date</li>
              <li>Accounts terminated for Terms of Service violations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">4. How to Request a Refund</h2>
            <p>To request a refund:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Log in to your SplitIt account</li>
              <li>Navigate to Account Settings → Billing</li>
              <li>Click on "Request Refund"</li>
              <li>Fill out the refund request form</li>
              <li>Our support team will review your request within 48 hours</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">5. Cancellation Policy</h2>
            <p>
              You may cancel your Premium subscription at any time. Cancellations will take effect at 
              the end of the current billing period. No partial refunds are provided for unused 
              subscription time after cancellation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">6. Contact Us</h2>
            <p>
              If you have questions about our Return & Refund Policy, please contact our support team at:{' '}
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
