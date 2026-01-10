"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type PaymentMethod = {
  id: string
  name: string
  enabled: boolean
}

export default function BillingSettings() {
  const [methods, setMethods] = React.useState<PaymentMethod[]>([
    { id: "cod", name: "Cash on Delivery", enabled: true },
    { id: "ssl", name: "SSLCommerz", enabled: true },
    { id: "stripe", name: "Stripe", enabled: false },
    { id: "razorpay", name: "Razorpay", enabled: false },
  ])

  const toggleMethod = (id: string) => {
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      )
    )
  }

  const handleSave = () => {
    console.log("Billing Settings Saved:", methods)
    alert("Billing settings saved successfully!")
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Billing & Payment Settings</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {methods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between border rounded p-4"
          >
            <Label className="text-base">{method.name}</Label>
            <Switch
              checked={method.enabled}
              onCheckedChange={() => toggleMethod(method.id)}
            />
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  )
}
