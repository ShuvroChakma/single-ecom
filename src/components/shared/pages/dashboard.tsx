"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
} from "lucide-react"

/* =======================
   MOCK DATA (API later)
======================= */

const stats = [
  {
    title: "Total Orders",
    value: "1,248",
    icon: ShoppingCart,
  },
  {
    title: "Total Revenue",
    value: "৳ 12,85,000",
    icon: DollarSign,
  },
  {
    title: "Customers",
    value: "684",
    icon: Users,
  },
  {
    title: "Products",
    value: "312",
    icon: Package,
  },
]

const recentOrders = [
  {
    id: "#ORD-1023",
    customer: "Rahim Ahmed",
    amount: 28500,
    status: "Completed",
  },
  {
    id: "#ORD-1024",
    customer: "Sadia Islam",
    amount: 42000,
    status: "Pending",
  },
  {
    id: "#ORD-1025",
    customer: "Mehedi Hasan",
    amount: 18500,
    status: "Cancelled",
  },
]

const lowStockProducts = [
  {
    name: "Diamond Ring",
    stock: 3,
  },
  {
    name: "Gold Necklace",
    stock: 5,
  },
]

/* =======================
   COMPONENT
======================= */

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your store performance
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center justify-between p-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
              <item.icon className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* RECENT ORDERS */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm">
              View all
            </Button>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id}
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "Completed"
                            ? "outline"
                            : order.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ৳{order.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* LOW STOCK */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.name}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Remaining: {product.stock}
                  </p>
                </div>
                <Badge variant="destructive">Low</Badge>
              </div>
            ))}

            <Button variant="outline" className="w-full">
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
