'use client';

import { useState, useEffect } from 'react';
import { generateSubdomainFromName, buildSubdomainUrl } from '@/lib/subdomain-utils';
import { auth } from '@/lib/firebase';

interface SubdomainManagerProps {
  orgId: string;
  orgName: string;
  currentSubdomain?: string;
  currentEnabled?: boolean | null;
  onUpdate?: () => void;
}

export default function SubdomainManager({
  orgId,
  orgName,
  currentSubdomain,
  currentEnabled,
  onUpdate,
}: SubdomainManagerProps) {
  const [subdomain, setSubdomain] = useState(currentSubdomain || '');
  const [enabled, setEnabled] = useState(currentEnabled ?? false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    available: boolean;
    error?: string | null;
  } | null>(null);

  // Sync local state with props when they change (e.g., from real-time updates)
  useEffect(() => {
    setSubdomain(currentSubdomain || '');
    setEnabled(currentEnabled ?? false);
  }, [currentSubdomain, currentEnabled]);

  // Auto-generate subdomain suggestion
  const handleGenerateSuggestion = () => {
    const suggested = generateSubdomainFromName(orgName);
    setSubdomain(suggested);
    validateSubdomain(suggested);
  };

  // Validate subdomain
  const validateSubdomain = async (value: string) => {
    if (!value) {
      setValidation(null);
      return;
    }

    setValidating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/subdomain/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ subdomain: value, excludeOrgId: orgId }),
      });

      if (!response.ok) {
        console.warn('[SubdomainManager] Validation endpoint returned:', response.status);
        // Don't block on validation errors - just skip validation
        setValidation({ valid: true, available: true });
        return;
      }

      const data = await response.json();
      setValidation(data);
    } catch (err) {
      console.error('[SubdomainManager] Validation error:', err);
      // Don't block on validation errors - assume valid
      setValidation({ valid: true, available: true });
    } finally {
      setValidating(false);
    }
  };

  // Handle subdomain change
  const handleSubdomainChange = (value: string) => {
    // Convert to lowercase and remove invalid characters
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(cleaned);
    setError(null);
    setSuccess(null);
    
    // Debounce validation
    if (cleaned) {
      const timer = setTimeout(() => validateSubdomain(cleaned), 500);
      return () => clearTimeout(timer);
    } else {
      setValidation(null);
    }
  };

  // Save subdomain configuration
  const handleSave = async () => {
    if (!subdomain) {
      setError('Subdomain is required');
      return;
    }

    // Only check validation if it exists and has been run
    if (validation && !validating) {
      if (!validation.valid || !validation.available) {
        setError(validation.error || 'Invalid subdomain');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      console.log('[SubdomainManager] Saving subdomain:', { subdomain, enabled, orgId });

      const response = await fetch(`/api/admin/organizations/${orgId}/subdomain`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subdomain, enabled }),
      });

      console.log('[SubdomainManager] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[SubdomainManager] Error response:', data);
        throw new Error(data.error || `Failed to update subdomain (${response.status})`);
      }

      const result = await response.json();
      console.log('[SubdomainManager] Success response:', result);

      setSuccess('Subdomain configuration updated successfully!');
      
      // Force a small delay before calling onUpdate to ensure Firestore has propagated
      setTimeout(() => {
        onUpdate?.();
      }, 500);
    } catch (err: any) {
      console.error('[SubdomainManager] Save error:', err);
      setError(err.message || 'Failed to update subdomain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Subdomain Configuration
      </h3>

      <div className="space-y-4">
        {/* Subdomain Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subdomain
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder="acmecorp"
                className="flex-1 px-3 py-2 outline-none"
                disabled={loading}
              />
              <span className="px-3 py-2 bg-gray-50 text-gray-600 text-sm border-l border-gray-300">
                .consularly.com
              </span>
            </div>
            <button
              onClick={handleGenerateSuggestion}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              disabled={loading}
            >
              Suggest
            </button>
          </div>

          {/* Validation Status */}
          {validating && (
            <p className="text-sm text-gray-500 mt-2">Validating...</p>
          )}
          {validation && !validating && (
            <div className="mt-2">
              {validation.valid && validation.available ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Available
                </p>
              ) : (
                <p className="text-sm text-red-600">{validation.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Enable Subdomain Access</p>
            <p className="text-sm text-gray-600">
              Allow users to access this organization via subdomain
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            disabled={loading}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Preview URL */}
        {subdomain && validation?.valid && validation?.available && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Preview URL</p>
            <a
              href={buildSubdomainUrl(subdomain)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {buildSubdomainUrl(subdomain)}
            </a>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading || validating}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
