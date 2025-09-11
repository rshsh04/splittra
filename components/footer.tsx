"use client"
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo and description */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="SplitIt Logo"
                  className="h-8 w-auto"
                />
              </Link>
              <p className="text-sm text-slate-500">
                Making expense sharing simple and stress-free for everyone.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 tracking-wider uppercase mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/terms" 
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy" 
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/return" 
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    Return Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 tracking-wider uppercase mb-4">
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="mailto:support@splitit.com"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    support@splitit.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-400 text-center">
              © {new Date().getFullYear()} SplitIt. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
