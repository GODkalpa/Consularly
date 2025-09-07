"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell,
  Palette,
  Database,
  Mail,
  Key,
  Users,
  TestTube
} from "lucide-react"

interface PlatformSettings {
  general: {
    platformName: string
    defaultLanguage: string
    defaultCurrency: string
    timezone: string
    maintenanceMode: boolean
  }
  features: {
    aiFeedback: boolean
    bodyLanguageAnalysis: boolean
    videoRecording: boolean
    realTimeScoring: boolean
    multiLanguageSupport: boolean
  }
  security: {
    twoFactorRequired: boolean
    passwordExpiry: number
    sessionTimeout: number
    ipWhitelisting: boolean
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    quotaAlerts: boolean
    systemAlerts: boolean
  }
}

const defaultSettings: PlatformSettings = {
  general: {
    platformName: "Mock Interview Platform",
    defaultLanguage: "en",
    defaultCurrency: "USD",
    timezone: "UTC",
    maintenanceMode: false
  },
  features: {
    aiFeedback: true,
    bodyLanguageAnalysis: true,
    videoRecording: true,
    realTimeScoring: false,
    multiLanguageSupport: true
  },
  security: {
    twoFactorRequired: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    ipWhitelisting: false
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    quotaAlerts: true,
    systemAlerts: true
  }
}

export function GlobalSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = (category: keyof PlatformSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    // Here you would typically save to your backend
    console.log('Saving settings:', settings)
    setHasChanges(false)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Global Settings</h2>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings}>
            Reset to Default
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.general.platformName}
                    onChange={(e) => updateSetting('general', 'platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select 
                    value={settings.general.defaultLanguage} 
                    onValueChange={(value) => updateSetting('general', 'defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select 
                    value={settings.general.defaultCurrency} 
                    onValueChange={(value) => updateSetting('general', 'defaultCurrency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST - Eastern Time</SelectItem>
                      <SelectItem value="PST">PST - Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT - Greenwich Mean Time</SelectItem>
                      <SelectItem value="CET">CET - Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to prevent user access during updates
                  </p>
                </div>
                <Switch
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Feature Configuration
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Feedback</Label>
                    <p className="text-sm text-muted-foreground">
                      Provide AI-powered feedback on mock interviews
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.aiFeedback}
                    onCheckedChange={(checked) => updateSetting('features', 'aiFeedback', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Body Language Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Analyze body language and facial expressions
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.bodyLanguageAnalysis}
                    onCheckedChange={(checked) => updateSetting('features', 'bodyLanguageAnalysis', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Video Recording</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to record their mock interviews
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.videoRecording}
                    onCheckedChange={(checked) => updateSetting('features', 'videoRecording', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Scoring</Label>
                    <p className="text-sm text-muted-foreground">
                      Provide real-time scoring during interviews
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.realTimeScoring}
                    onCheckedChange={(checked) => updateSetting('features', 'realTimeScoring', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Multi-language Support</Label>
                    <p className="text-sm text-muted-foreground">
                      Support multiple languages for interviews
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.multiLanguageSupport}
                    onCheckedChange={(checked) => updateSetting('features', 'multiLanguageSupport', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security policies and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require all users to enable 2FA
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) => updateSetting('security', 'twoFactorRequired', checked)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={settings.security.passwordExpiry}
                      onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.ipWhitelisting}
                    onCheckedChange={(checked) => updateSetting('security', 'ipWhitelisting', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quota Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when organizations approach quota limits
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.quotaAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'quotaAlerts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Send system maintenance and update alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'systemAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding & Appearance
              </CardTitle>
              <CardDescription>Customize platform branding and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" placeholder="https://example.com/logo.png" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input id="primaryColor" type="color" defaultValue="#0066cc" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Textarea 
                    id="welcomeMessage" 
                    placeholder="Welcome to our mock interview platform..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input id="footerText" placeholder="© 2024 Mock Interview Platform. All rights reserved." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Third-party Integrations
              </CardTitle>
              <CardDescription>Configure external service integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailProvider">Email Provider</Label>
                      <Select defaultValue="sendgrid">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="ses">Amazon SES</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailApiKey">API Key</Label>
                      <Input id="emailApiKey" type="password" placeholder="Enter API key" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Gateway</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentProvider">Payment Provider</Label>
                      <Select defaultValue="stripe">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentApiKey">API Key</Label>
                      <Input id="paymentApiKey" type="password" placeholder="Enter API key" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="analyticsProvider">Analytics Provider</Label>
                      <Select defaultValue="google">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google Analytics</SelectItem>
                          <SelectItem value="mixpanel">Mixpanel</SelectItem>
                          <SelectItem value="amplitude">Amplitude</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="analyticsId">Tracking ID</Label>
                      <Input id="analyticsId" placeholder="Enter tracking ID" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
