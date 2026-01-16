"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { Volume2, Loader2, Play, AlertCircle } from "lucide-react"
import { auth } from "@/lib/firebase"
import type { TTSAdminConfig, Voice } from "@/types/tts"

export function TTSSettings() {
  const [config, setConfig] = useState<TTSAdminConfig>({
    enabled: true,
    voiceId: '',
    speechRate: 1.0,
    volume: 1.0,
  })
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch current config on mount
  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/admin/tts-config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch TTS config')
      }

      const data = await response.json()
      setConfig(data.config)
      setAvailableVoices(data.availableVoices || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load TTS settings')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/admin/tts-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save TTS config')
      }

      setSuccess('TTS settings saved successfully')
      setHasChanges(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save TTS settings')
    } finally {
      setSaving(false)
    }
  }

  const testVoice = async () => {
    try {
      setTesting(true)
      setError(null)

      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Good morning. What is the purpose of your visit to the United States?',
          voiceId: config.voiceId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate test audio')
      }

      const data = await response.json()
      
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl)
        await audio.play()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test voice')
    } finally {
      setTesting(false)
    }
  }

  const updateConfig = (key: keyof TTSAdminConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSuccess(null)
  }

  const selectedVoice = availableVoices.find(v => v.voiceId === config.voiceId)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Text-to-Speech Settings
        </CardTitle>
        <CardDescription>
          Configure voice synthesis for USA F1 visa interview questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Enable/Disable TTS */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable TTS for USA F1 Interviews</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, interview questions will be spoken aloud by a simulated visa officer
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig('enabled', checked)}
          />
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <Label>Voice Selection</Label>
          <Select
            value={config.voiceId}
            onValueChange={(value) => updateConfig('voiceId', value)}
            disabled={!config.enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((voice) => (
                <SelectItem key={voice.voiceId} value={voice.voiceId}>
                  <div className="flex items-center gap-2">
                    <span>{voice.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {voice.gender}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVoice && (
            <p className="text-sm text-muted-foreground">
              {selectedVoice.description}
            </p>
          )}
        </div>

        {/* Speech Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Speech Rate</Label>
            <span className="text-sm text-muted-foreground">{config.speechRate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            value={config.speechRate}
            onChange={(e) => updateConfig('speechRate', parseFloat(e.target.value))}
            min={0.5}
            max={2.0}
            step={0.1}
            disabled={!config.enabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slower (0.5x)</span>
            <span>Normal (1.0x)</span>
            <span>Faster (2.0x)</span>
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <span className="text-sm text-muted-foreground">{Math.round(config.volume * 100)}%</span>
          </div>
          <input
            type="range"
            value={config.volume}
            onChange={(e) => updateConfig('volume', parseFloat(e.target.value))}
            min={0}
            max={1}
            step={0.1}
            disabled={!config.enabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={testVoice}
            disabled={!config.enabled || testing || !config.voiceId}
          >
            {testing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Test Voice</>
            )}
          </Button>
          <Button
            onClick={saveConfig}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
