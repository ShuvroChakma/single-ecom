
import { Upload } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


export default function GeneralSettings() {
  const [logo, setLogo] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  const [form, setForm] = React.useState({
    storeName: "Gold Jewellery Shop",
    email: "support@goldshop.com",
    phone: "+880 17XXXXXXX",
    address: "Dhaka, Bangladesh",
  })

  const handleLogoChange = (file: File | null) => {
    if (!file) return
    setLogo(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    const payload = {
      ...form,
      logo,
    }

    console.log("General Settings Saved:", payload)
    alert("General settings saved successfully!")
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Store Name */}
        <div className="space-y-2">
          <Label>Store Name</Label>
          <Input
            value={form.storeName}
            onChange={(e) =>
              setForm({ ...form, storeName: e.target.value })
            }
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Store Logo</Label>

          <div className="flex items-center gap-4">
            {preview && (
              <img
                src={preview}
                alt="Logo Preview"
                className="h-16 w-16 rounded object-cover border"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-2 text-sm">
              <Upload className="h-4 w-4" />
              Upload Logo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  handleLogoChange(e.target.files?.[0] || null)
                }
              />
            </label>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  )
}
