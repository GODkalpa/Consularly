"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, X, Save, AlertCircle, Image as ImageIcon, Palette, Type, Link2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"
import { toast } from "sonner"
import type { OrganizationBranding } from "@/types/firestore"
import { brandingCache } from "@/lib/branding/branding-cache"
import { useOrgContext } from "@/hooks/useOrgContext"

/**
 * Updates the page favicon dynamically
 */
function updateFavicon(faviconUrl: string) {
  if (typeof window === 'undefined') return;
  
  // Find existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  
  // Remove existing favicon links
  existingLinks.forEach(link => link.remove());

  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/x-icon';
  link.href = faviconUrl;
  
  // Append to head
  document.head.appendChild(link);

  // Also create apple-touch-icon for better mobile support
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = faviconUrl;
  document.head.appendChild(appleLink);
}

interface OrgBrandingSettingsProps {
  organizationPlan?: 'basic' | 'premium' | 'enterprise';
  initialBranding?: OrganizationBranding;
}

export function OrgBrandingSettings({ organizationPlan = 'basic', initialBranding }: OrgBrandingSettingsProps) {
  const { context } = useOrgContext()
  const [branding, setBranding] = useState<OrganizationBranding>(initialBranding || {})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialBranding) {
      setBranding(initialBranding)
      // Apply favicon if present
      if (initialBranding.favicon) {
        updateFavicon(initialBranding.favicon)
      }
    }
  }, [initialBranding])

  const handleUpload = async (file: File, field: keyof OrganizationBranding) => {
    try {
      setUploading(field)
      const result = await uploadToCloudinary(file, {
        folder: 'org-branding',
        maxFileSize: 5 * 1024 * 1024,
      })

      // Delete old image if exists
      const oldUrl = branding[field] as string | undefined
      if (oldUrl && oldUrl.includes('cloudinary.com')) {
        const publicId = oldUrl.split('/').slice(-2).join('/').split('.')[0]
        await deleteFromCloudinary(publicId).catch(() => {
          // Ignore delete errors
        })
      }

      setBranding((prev) => ({ ...prev, [field]: result.url }))
      setHasChanges(true)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error('Upload failed', { description: error.message })
    } finally {
      setUploading(null)
    }
  }

  const handleFileSelect = (field: keyof OrganizationBranding) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file, field)
    }
  }

  const handleRemoveImage = (field: keyof OrganizationBranding) => {
    setBranding((prev) => ({ ...prev, [field]: undefined }))
    setHasChanges(true)
  }

  const handleInputChange = (field: keyof OrganizationBranding, value: any) => {
    setBranding((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setBranding((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value || undefined,
      },
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/org/branding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ branding }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Failed to save branding')
      }

      await response.json()
      
      // Invalidate branding cache to force refresh
      if (context?.orgId) {
        brandingCache.invalidate(context.orgId)
      }
      
      toast.success('Branding settings saved successfully')
      setHasChanges(false)
      
      // Update favicon immediately if changed
      if (branding.favicon) {
        updateFavicon(branding.favicon)
      }
      
      // Trigger a custom event to notify other components about branding update
      window.dispatchEvent(new CustomEvent('brandingUpdated', { 
        detail: { branding } 
      }))
    } catch (error: any) {
      toast.error('Failed to save branding', { description: error.message })
    } finally {
      setSaving(false)
    }
  }

  const isEnterprise = organizationPlan === 'enterprise'

  return (
    <div className="space-y-6">
      {/* Save Button */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 -mx-6 mb-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              You have unsaved changes
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visual">
            <ImageIcon className="h-4 w-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="text">
            <Type className="h-4 w-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Link2 className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Visual Assets */}
        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Upload your organization&apos;s logo. For best results:
                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                  <li>Use PNG with transparent background or SVG format</li>
                  <li>Recommended size: 200x60px (width × height)</li>
                  <li>Horizontal/wide logos work best</li>
                  <li>Ensure good contrast on white backgrounds</li>
                </ul>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {branding.logoUrl ? (
                  <div className="relative">
                    <div className="h-20 w-auto min-w-[80px] max-w-[200px] bg-white border-2 rounded-lg shadow-sm flex items-center justify-center p-3">
                      <img
                        src={branding.logoUrl}
                        alt="Logo"
                        className="max-h-16 object-contain"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => handleRemoveImage('logoUrl')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-muted/20">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No logo</p>
                    </div>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect('logoUrl')}
                />
                <Button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === 'logoUrl'}
                >
                  {uploading === 'logoUrl' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Logo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>
                Small icon for browser tabs. Recommended size: 32x32px or 64x64px (PNG or ICO)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {branding.favicon ? (
                  <div className="relative">
                    <img
                      src={branding.favicon}
                      alt="Favicon"
                      className="h-8 w-8 object-contain border rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2"
                      onClick={() => handleRemoveImage('favicon')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-8 w-8 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect('favicon')}
                />
                <Button
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploading === 'favicon'}
                  variant="outline"
                >
                  {uploading === 'favicon' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Favicon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Background Image</CardTitle>
              <CardDescription>
                Optional hero background image for dashboard header
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {branding.backgroundImage ? (
                  <div className="relative">
                    <img
                      src={branding.backgroundImage}
                      alt="Background"
                      className="h-24 w-48 object-cover border rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2"
                      onClick={() => handleRemoveImage('backgroundImage')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-24 w-48 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    No background
                  </div>
                )}
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect('backgroundImage')}
                />
                <Button
                  onClick={() => backgroundInputRef.current?.click()}
                  disabled={uploading === 'backgroundImage'}
                  variant="outline"
                >
                  {uploading === 'backgroundImage' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Background
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize your organization&apos;s color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor || '#1d4ed8'}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-24 h-10"
                  />
                  <Input
                    value={branding.primaryColor || '#1d4ed8'}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#1d4ed8"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary/Accent Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor || '#7c3aed'}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-24 h-10"
                  />
                  <Input
                    value={branding.secondaryColor || '#7c3aed'}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#7c3aed"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={branding.backgroundColor || '#ffffff'}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="w-24 h-10"
                  />
                  <Input
                    value={branding.backgroundColor || '#ffffff'}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text & Content */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Text Content</CardTitle>
              <CardDescription>
                Customize text displayed across your organization dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={branding.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Your Organization Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={branding.tagline || ''}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="Your company tagline or slogan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={branding.welcomeMessage || ''}
                  onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                  placeholder="Custom greeting message for your dashboard"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  value={branding.footerText || ''}
                  onChange={(e) => handleInputChange('footerText', e.target.value)}
                  placeholder="© 2025 Your Organization. All rights reserved."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={branding.fontFamily || 'inter'}
                  onValueChange={(value) => handleInputChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter (Default)</SelectItem>
                    <SelectItem value="poppins">Poppins</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="montserrat">Montserrat</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Add links to your organization&apos;s social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={branding.socialLinks?.website || ''}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={branding.socialLinks?.linkedin || ''}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  type="url"
                  value={branding.socialLinks?.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourcompany"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={branding.socialLinks?.facebook || ''}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourcompany"
                />
              </div>
            </CardContent>
          </Card>

          {isEnterprise && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    White Label Mode
                    <Badge className="ml-2">Enterprise</Badge>
                  </CardTitle>
                  <CardDescription>
                    Hide platform branding to use only your organization&apos;s branding
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whiteLabel">Enable White Label</Label>
                    <Switch
                      id="whiteLabel"
                      checked={branding.whiteLabel || false}
                      onCheckedChange={(checked) => handleInputChange('whiteLabel', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Custom CSS
                    <Badge className="ml-2">Enterprise</Badge>
                  </CardTitle>
                  <CardDescription>
                    Add custom CSS for advanced styling (use with caution)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={branding.customCSS || ''}
                    onChange={(e) => handleInputChange('customCSS', e.target.value)}
                    placeholder=".org-dashboard { /* your custom styles */ }"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Bottom Save Button */}
      {hasChanges && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
