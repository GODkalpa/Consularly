'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  const orgName = searchParams.get('orgName');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access {orgName ? `${orgName}'s` : 'this'} portal.
          </p>
        </div>

        <div className="space-y-4 text-left bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Why am I seeing this?</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>You may be logged in with the wrong account</li>
            <li>Your account may not be associated with this organization</li>
            <li>You may need to request access from your administrator</li>
          </ul>
        </div>

        {subdomain && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800">
              <strong>Subdomain:</strong> <span className="font-mono">{subdomain}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/signin"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In with Different Account
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Main Portal
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          If you need access to this organization, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
