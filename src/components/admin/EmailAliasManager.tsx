'use client'

import { useState, useEffect } from 'react'
import { Mail, RefreshCw, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { auth } from '@/lib/firebase'

interface EmailAliasManagerProps {
  orgId: string
  orgName: string
}

export default function EmailAliasManager({ orgId, orgName }: EmailAliasManagerProps) {
  const [emailAlias, setEmailAlias] = useState<string>('')
  const [manualAlias, setManualAlias] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testEmail, setTestEmail] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Fetch current email alias
  useEffect(() => {
    fetchEmailAlias()
  }, [orgId])

  const fetchEmailAlias = async () => {
    try {
      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')
      
      const response = await fetch(`/api/admin/organizations/${orgId}/email-alias`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch email alias')
      }

      const data = await response.json()
      setEmailAlias(data.emailAlias || '')
      setManualAlias(data.emailAlias || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoGenerate = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`/api/admin/organizations/${orgId}/email-alias`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ autoGenerate: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email alias')
      }

      setEmailAlias(data.emailAlias)
      setManualAlias(data.emailAlias)
      setSuccess('Email alias generated successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!manualAlias.trim()) {
        throw new Error('Email alias cannot be empty')
      }

      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`/api/admin/organizations/${orgId}/email-alias`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emailAlias: manualAlias.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email alias')
      }

      setEmailAlias(data.emailAlias)
      setSuccess('Email alias updated successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true)
      setError('')
      setSuccess('')

      if (!testEmail.trim()) {
        throw new Error('Please enter a recipient email address')
      }

      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orgId, recipientEmail: testEmail.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email')
      }

      setSuccess(`Test email sent successfully to ${testEmail}!`)
      setTestEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
        </div>
        <p className="text-sm text-gray-600">
          Configure organization-specific email alias for white-labeled communication
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Email Alias */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Email Alias
          </label>
          {emailAlias ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <code className="text-sm font-mono text-green-900">{emailAlias}</code>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-900">
                No email alias configured. Using default: info@consularly.com
              </span>
            </div>
          )}
        </div>

        {/* Auto-Generate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-Generate Email Alias
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Generate an email alias based on the organization name: <strong>{orgName}</strong>
          </p>
          <button
            onClick={handleAutoGenerate}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Generating...' : 'Generate Email Alias'}
          </button>
        </div>

        {/* Manual Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manual Email Alias
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Format: {'{name}'}@consularly.com (lowercase, alphanumeric, hyphens only)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualAlias}
              onChange={(e) => setManualAlias(e.target.value)}
              placeholder="sumedha-education@consularly.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleManualSave}
              disabled={saving || !manualAlias.trim()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Test Email */}
        <div className="pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Send Test Email
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Send a test email to verify SMTP configuration and branding
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmail.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className={`w-4 h-4 ${sendingTest ? 'animate-pulse' : ''}`} />
              {sendingTest ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Success</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
            <button
              onClick={() => setSuccess('')}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
