import { createPosOrder, Order } from "@/api/orders"
import { getAdminProducts, Product, ProductVariant } from "@/api/products"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getImageUrl } from "@/lib/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Check,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/dashboard/orders/pos/")({
  component: POSPage,
})

interface CartItem {
  variant_id: string
  product_id: string
  product_name: string
  variant_sku: string
  variant_info: string
  unit_price: number
  quantity: number
  product_image: string | null
}

function POSPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [notes, setNotes] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["pos-products", debouncedSearch],
    queryFn: () =>
      getAdminProducts({
        data: {
          search: debouncedSearch || undefined,
          is_active: true,
          per_page: 20,
        },
      }),
  })

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => createPosOrder({ data: { order: orderData } }),
    onSuccess: (result) => {
      if (result.success) {
        setCreatedOrder(result.data)
        setIsSuccessDialogOpen(true)
        toast.success(`Order ${result.data.order_number} created successfully!`)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order")
    },
  })

  const products = productsData?.success ? productsData.data.items : []

  // Calculate variant price (simplified - you may need to adjust based on your pricing logic)
  const calculateVariantPrice = (variant: ProductVariant): number => {
    // For jewelry, price is typically based on metal weight and rate
    // This is a simplified version - adjust based on your actual pricing logic
    return variant.net_weight * 100 // Placeholder - adjust as needed
  }

  // Add product to cart
  const handleAddProduct = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      toast.error("Product has no variants available")
      return
    }

    if (product.variants.length === 1) {
      // Add directly if only one variant
      addVariantToCart(product, product.variants[0])
    } else {
      // Show variant selection dialog
      setSelectedProduct(product)
      setIsVariantDialogOpen(true)
    }
  }

  const addVariantToCart = (product: Product, variant: ProductVariant) => {
    const existingIndex = cart.findIndex((item) => item.variant_id === variant.id)

    if (existingIndex >= 0) {
      // Increment quantity if already in cart
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      setCart(newCart)
    } else {
      // Add new item
      const variantInfo = [
        variant.metal_type,
        variant.metal_purity,
        variant.size ? `Size ${variant.size}` : null,
      ]
        .filter(Boolean)
        .join(" - ")

      setCart([
        ...cart,
        {
          variant_id: variant.id,
          product_id: product.id,
          product_name: product.name,
          variant_sku: variant.sku,
          variant_info,
          unit_price: calculateVariantPrice(variant),
          quantity: 1,
          product_image: product.images?.[0] || null,
        },
      ])
    }

    setIsVariantDialogOpen(false)
    setSelectedProduct(null)
  }

  // Update quantity
  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.variant_id === variantId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // Remove from cart
  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variantId))
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = subtotal

  // Create order
  const handleCreateOrder = () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name")
      return
    }
    if (!customerPhone.trim()) {
      toast.error("Please enter customer phone")
      return
    }
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    const orderData = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      items: cart.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
      payment_method: paymentMethod,
      mark_as_paid: true,
      notes: notes.trim() || undefined,
    }

    createOrderMutation.mutate(orderData)
  }

  // Reset form after success
  const handleNewOrder = () => {
    setCart([])
    setCustomerName("")
    setCustomerPhone("")
    setPaymentMethod("cod")
    setNotes("")
    setCreatedOrder(null)
    setIsSuccessDialogOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with Customer Info */}
      <div className="flex items-center justify-between gap-6 mb-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Create orders for walk-in customers</p>
        </div>

        {/* Customer Info - Horizontal */}
        <Card className="flex-1 max-w-xl">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <div className="flex-1 flex gap-3">
                <Input
                  placeholder="Customer name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Phone number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left Panel - Product Selection */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {productsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="h-12 w-12 mb-2" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="group flex flex-col items-center p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left"
                    >
                      {product.images?.[0] ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md mb-2 flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-medium text-sm text-center line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.sku_base}</p>
                      {product.variants && product.variants.length > 1 && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {product.variants.length} variants
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Cart & Checkout */}
        <div className="w-96 flex flex-col gap-4 overflow-hidden">
          {/* Cart */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mb-2" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.variant_id}
                      className="flex gap-3 p-2 rounded-lg border bg-card"
                    >
                      {item.product_image ? (
                        <img
                          src={getImageUrl(item.product_image)}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.variant_info}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.variant_sku}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-semibold text-sm">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variant_id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variant_id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.variant_id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checkout */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Order notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Create Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variant Selection Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Variant</DialogTitle>
            <DialogDescription>
              Choose a variant for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {selectedProduct?.variants?.map((variant) => (
              <button
                key={variant.id}
                onClick={() => addVariantToCart(selectedProduct, variant)}
                className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left"
              >
                <div>
                  <p className="font-medium">
                    {variant.metal_type} {variant.metal_purity}
                    {variant.size && ` - Size ${variant.size}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{variant.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(calculateVariantPrice(variant))}</p>
                  <p className="text-xs text-muted-foreground">
                    {variant.stock_quantity} in stock
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Order Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold">{createdOrder?.order_number}</p>
              <p className="text-muted-foreground">
                Total: {createdOrder && formatCurrency(Number(createdOrder.total))}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard/orders" })}>
              View Orders
            </Button>
            <Button onClick={handleNewOrder}>New Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
