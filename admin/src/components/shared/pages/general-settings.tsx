import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { getAdminGroupedSettings, bulkUpdateSettings, initializeSettings, SettingsGrouped } from "@/api/settings"

type FlatSettings = Record<string, string>

function flattenSettings(grouped: SettingsGrouped): FlatSettings {
  return {
    ...grouped.general,
    ...grouped.contact,
    ...grouped.social,
    ...grouped.shipping,
    ...grouped.seo,
    ...grouped.appearance,
  }
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  type?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  )
}

export default function GeneralSettings() {
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FlatSettings>({})
  const [initialized, setInitialized] = React.useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getAdminGroupedSettings(),
  })

  React.useEffect(() => {
    if (data?.success && !initialized) {
      setForm(flattenSettings(data.data))
      setInitialized(true)
    }
  }, [data, initialized])

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (settings: FlatSettings) =>
      bulkUpdateSettings({ data: { settings } }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Saved ${res.data.updated_count} settings`)
        queryClient.invalidateQueries({ queryKey: ["admin-settings"] })
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save settings")
    },
  })

  const { mutate: initialize, isPending: isInitializing } = useMutation({
    mutationFn: () => initializeSettings(),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Initialized ${res.data.created_count} default settings`)
        queryClient.invalidateQueries({ queryKey: ["admin-settings"] })
        setInitialized(false)
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to initialize settings")
    },
  })

  const set = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }))

  const v = (key: string) => form[key] ?? ""

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your store configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => initialize()}
            disabled={isInitializing}
          >
            {isInitializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Initialize Defaults
          </Button>
          <Button
            size="sm"
            onClick={() => saveSettings(form)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic store information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Store Name" name="store_name" value={v("store_name")} onChange={set} placeholder="My Jewellery Store" />
              <FormField label="Store Tagline" name="store_tagline" value={v("store_tagline")} onChange={set} placeholder="Exquisite Jewelry for Every Occasion" />
              <FormField label="Store Logo URL" name="store_logo" value={v("store_logo")} onChange={set} placeholder="/logo.svg" hint="Path or full URL to your logo image" />
              <FormField label="Favicon URL" name="store_favicon" value={v("store_favicon")} onChange={set} placeholder="/favicon.ico" />
              <Separator />
              <FormField label="Currency Code" name="currency" value={v("currency")} onChange={set} placeholder="BDT" hint="ISO currency code e.g. BDT, USD" />
              <FormField label="Currency Symbol" name="currency_symbol" value={v("currency_symbol")} onChange={set} placeholder="৳" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Contact details shown in footer and emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Contact Email" name="contact_email" type="email" value={v("contact_email")} onChange={set} placeholder="hello@mystore.com" />
              <FormField label="Support Email" name="support_email" type="email" value={v("support_email")} onChange={set} placeholder="support@mystore.com" />
              <FormField label="Phone Number" name="contact_phone" type="tel" value={v("contact_phone")} onChange={set} placeholder="+880 1700000000" />
              <FormField label="WhatsApp Number" name="whatsapp_number" value={v("whatsapp_number")} onChange={set} placeholder="8801700000000" hint="International format without +, used for wa.me links" />
              <TextareaField label="Address" name="contact_address" value={v("contact_address")} onChange={set} placeholder="123 Main St, Dhaka, Bangladesh" rows={3} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Social media profile URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Facebook" name="facebook_url" value={v("facebook_url")} onChange={set} placeholder="https://facebook.com/yourpage" />
              <FormField label="Instagram" name="instagram_url" value={v("instagram_url")} onChange={set} placeholder="https://instagram.com/yourpage" />
              <FormField label="Twitter / X" name="twitter_url" value={v("twitter_url")} onChange={set} placeholder="https://twitter.com/yourhandle" />
              <FormField label="Pinterest" name="pinterest_url" value={v("pinterest_url")} onChange={set} placeholder="https://pinterest.com/yourpage" />
              <FormField label="YouTube" name="youtube_url" value={v("youtube_url")} onChange={set} placeholder="https://youtube.com/@yourchannel" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIPPING */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
              <CardDescription>Shipping thresholds and delivery estimates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Free Shipping Threshold"
                name="free_shipping_threshold"
                type="number"
                value={v("free_shipping_threshold")}
                onChange={set}
                placeholder="5000"
                hint="Orders above this amount get free shipping (in store currency)"
              />
              <FormField
                label="Default Min Shipping Days"
                name="default_shipping_days_min"
                type="number"
                value={v("default_shipping_days_min")}
                onChange={set}
                placeholder="3"
              />
              <FormField
                label="Default Max Shipping Days"
                name="default_shipping_days_max"
                type="number"
                value={v("default_shipping_days_max")}
                onChange={set}
                placeholder="7"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Analytics</CardTitle>
              <CardDescription>Search engine optimization and tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Meta Title" name="meta_title" value={v("meta_title")} onChange={set} placeholder="My Jewellery Store – Exquisite Jewelry" />
              <TextareaField label="Meta Description" name="meta_description" value={v("meta_description")} onChange={set} placeholder="Discover our collection of handcrafted jewelry..." rows={3} />
              <Separator />
              <FormField label="Google Analytics ID" name="google_analytics_id" value={v("google_analytics_id")} onChange={set} placeholder="G-XXXXXXXXXX" />
              <FormField label="Facebook Pixel ID" name="facebook_pixel_id" value={v("facebook_pixel_id")} onChange={set} placeholder="1234567890123456" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Brand colors used across the storefront</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      id="primary_color"
                      value={v("primary_color") || "#D4AF37"}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer p-0.5"
                    />
                    <Input
                      value={v("primary_color")}
                      onChange={(e) => set("primary_color", e.target.value)}
                      placeholder="#D4AF37"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      id="secondary_color"
                      value={v("secondary_color") || "#1a1a1a"}
                      onChange={(e) => set("secondary_color", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer p-0.5"
                    />
                    <Input
                      value={v("secondary_color")}
                      onChange={(e) => set("secondary_color", e.target.value)}
                      placeholder="#1a1a1a"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      id="accent_color"
                      value={v("accent_color") || "#C9A959"}
                      onChange={(e) => set("accent_color", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer p-0.5"
                    />
                    <Input
                      value={v("accent_color")}
                      onChange={(e) => set("accent_color", e.target.value)}
                      placeholder="#C9A959"
                      className="font-mono text-sm"
                    />
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
