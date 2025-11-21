'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  const orgName = searchParams.get('orgName');
  const reason = searchParams.get('reason');

  const isOrgMismatch = reason === 'org_mismatch';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          {isOrgMismatch ? (
            <p className="text-gray-600 mb-4">
              Your account does not belong to this organization. Each organization has its own subdomain and only members can access it.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              You don&apos;t have permission to access {orgName ? `${orgName}'s` : 'this'} portal.
            </p>
          )}
        </div>

        <div className="space-y-4 text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-900 font-semibold">
            {isOrgMismatch ? 'Organization Mismatch' : 'Why am I seeing this?'}
          </p>
          <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
            {isOrgMismatch ? (
              <>
                <li>You logged in with credentials from a different organization</li>
                <li>Each organization has its own unique subdomain</li>
                <li>You must use the correct subdomain for your organization</li>
              </>
            ) : (
              <>
                <li>You may be logged in with the wrong account</li>
                <li>Your account may not be associated with this organization</li>
                <li>You may need to request access from your administrator</li>
              </>
            )}
          </ul>
        </div>

        {subdomain && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800">
              <strong>Current Subdomain:</strong> <span className="font-mono">{subdomain}</span>
            </p>
            {isOrgMismatch && (
              <p className="text-xs text-blue-700 mt-2">
                Please use your organization&apos;s subdomain to sign in.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={subdomain ? `https://${subdomain}.consulary.com/signin` : '/signin'}
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In with Correct Account
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Main Portal
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          {isOrgMismatch 
            ? 'Contact your administrator if you need help finding your organization\'s subdomain.'
            : 'If you need access to this organization, please contact your administrator.'}
        </p>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
}
