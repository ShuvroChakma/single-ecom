import {
  GatewayConfigTemplate,
  PaymentGateway,
  PaymentGatewayPayload,
  getGatewayConfigTemplate,
  getPaymentGateways,
  initializeGateways,
  togglePaymentGateway,
  updatePaymentGateway,
} from "@/api/payments"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Banknote,
  Check,
  CreditCard,
  Loader2,
  RefreshCw,
  Settings,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/settings/payments/")({
  component: PaymentGatewaysPage,
})

const GATEWAY_ICONS: Record<string, React.ReactNode> = {
  cod: <Banknote className="h-6 w-6" />,
  bkash: <CreditCard className="h-6 w-6 text-pink-500" />,
  nagad: <CreditCard className="h-6 w-6 text-orange-500" />,
  rocket: <CreditCard className="h-6 w-6 text-purple-500" />,
  sslcommerz: <CreditCard className="h-6 w-6 text-blue-500" />,
  amarpay: <CreditCard className="h-6 w-6 text-green-500" />,
}

function PaymentGatewaysPage() {
  const queryClient = useQueryClient()
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: () => getPaymentGateways(),
  })

  const initMutation = useMutation({
    mutationFn: () => initializeGateways(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways"] })
      if (result.success && result.data.created_count > 0) {
        toast.success(`Initialized ${result.data.created_count} payment gateways`)
      } else {
        toast.info("All gateways already initialized")
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initialize gateways")
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      togglePaymentGateway({ data: { id, enabled } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways"] })
      toast.success(`Gateway ${variables.enabled ? "enabled" : "disabled"}`)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to toggle gateway")
    },
  })

  const handleConfigure = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway)
    setIsConfigDialogOpen(true)
  }

  const handleToggle = (gateway: PaymentGateway) => {
    toggleMutation.mutate({ id: gateway.id, enabled: !gateway.is_enabled })
  }

  const gateways = data?.success ? data.data : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="text-muted-foreground">
            Configure payment methods for your store
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => initMutation.mutate()}
          disabled={initMutation.isPending}
        >
          {initMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Initialize Gateways
        </Button>
      </div>

      {gateways.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Payment Gateways</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click "Initialize Gateways" to set up default payment methods
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className={!gateway.is_enabled ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {GATEWAY_ICONS[gateway.code] || <CreditCard className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-base">{gateway.name}</CardTitle>
                      <CardDescription className="text-xs uppercase">
                        {gateway.code}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={gateway.is_enabled}
                    onCheckedChange={() => handleToggle(gateway)}
                    disabled={toggleMutation.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {gateway.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {gateway.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {gateway.is_sandbox && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Sandbox
                    </Badge>
                  )}
                  {gateway.has_config ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : gateway.code !== "cod" ? (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <X className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  ) : null}
                </div>

                {(gateway.min_amount || gateway.max_amount) && (
                  <div className="text-xs text-muted-foreground">
                    {gateway.min_amount && <span>Min: ৳{gateway.min_amount}</span>}
                    {gateway.min_amount && gateway.max_amount && <span> • </span>}
                    {gateway.max_amount && <span>Max: ৳{gateway.max_amount}</span>}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleConfigure(gateway)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GatewayConfigDialog
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
        gateway={selectedGateway}
      />
    </div>
  )
}

interface GatewayConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gateway: PaymentGateway | null
}

function GatewayConfigDialog({ open, onOpenChange, gateway }: GatewayConfigDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSandbox, setIsSandbox] = useState(true)
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [configJson, setConfigJson] = useState("")
  const [configError, setConfigError] = useState<string | null>(null)

  const { data: templateData } = useQuery({
    queryKey: ["gateway-config-template", gateway?.code],
    queryFn: () => getGatewayConfigTemplate({ data: { code: gateway!.code } }),
    enabled: !!gateway && gateway.code !== "cod",
  })

  const updateMutation = useMutation({
    mutationFn: (payload: PaymentGatewayPayload) =>
      updatePaymentGateway({ data: { id: gateway!.id, gateway: payload } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways"] })
      toast.success("Gateway updated successfully")
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update gateway")
    },
  })

  useEffect(() => {
    if (open && gateway) {
      setName(gateway.name)
      setDescription(gateway.description || "")
      setIsSandbox(gateway.is_sandbox)
      setMinAmount(gateway.min_amount?.toString() || "")
      setMaxAmount(gateway.max_amount?.toString() || "")
      setConfigJson("")
      setConfigError(null)
    }
  }, [open, gateway])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let config = undefined
    if (configJson.trim()) {
      try {
        config = JSON.parse(configJson)
        setConfigError(null)
      } catch {
        setConfigError("Invalid JSON format")
        return
      }
    }

    const payload: PaymentGatewayPayload = {
      name,
      description: description || null,
      is_sandbox: isSandbox,
      min_amount: minAmount ? parseFloat(minAmount) : null,
      max_amount: maxAmount ? parseFloat(maxAmount) : null,
    }

    if (config) {
      payload.config = config
    }

    updateMutation.mutate(payload)
  }

  const template = templateData?.success ? templateData.data : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {gateway?.name}</DialogTitle>
          <DialogDescription>
            Update gateway settings and API credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gateway name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="No maximum"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sandbox">Sandbox Mode</Label>
              <p className="text-xs text-muted-foreground">Use test environment</p>
            </div>
            <Switch
              id="sandbox"
              checked={isSandbox}
              onCheckedChange={setIsSandbox}
            />
          </div>

          {gateway?.code !== "cod" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="config">API Credentials (JSON)</Label>
                {gateway?.has_config && (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    Currently configured
                  </Badge>
                )}
              </div>
              <Textarea
                id="config"
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value)
                  setConfigError(null)
                }}
                placeholder="Leave empty to keep existing credentials"
                rows={6}
                className="font-mono text-sm"
              />
              {configError && (
                <p className="text-sm text-destructive">{configError}</p>
              )}

              {template && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-xs font-medium mb-2">Required fields:</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.required_fields.map((field) => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {template.required_fields.length === 0 && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                  {template.optional_fields.length > 0 && (
                    <>
                      <p className="text-xs font-medium mb-2">Optional fields:</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {template.optional_fields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setConfigJson(JSON.stringify(template.example, null, 2))}
                  >
                    Load Example
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
