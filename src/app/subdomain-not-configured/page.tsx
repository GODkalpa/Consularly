'use client';

import Link from 'next/link';

export default function SubdomainNotConfiguredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subdomain Not Configured
          </h1>
          <p className="text-gray-600 mb-4">
            This organization&apos;s subdomain access is currently disabled.
          </p>
        </div>

        <div className="space-y-4 text-left bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>What does this mean?</strong>
          </p>
          <p className="text-sm text-gray-600">
            The organization exists but subdomain access has not been enabled yet. This may be temporary during setup or configuration.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Main Portal
          </Link>
          
          <a
            href="mailto:support@consularly.com"
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Contact Support
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Please contact your organization administrator to enable subdomain access.
        </p>
      </div>
    </div>
  );
}
