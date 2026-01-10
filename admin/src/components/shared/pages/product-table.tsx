"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Upload, X } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/* =======================
   TYPES
======================= */

type Product = {
  id: string
  name: string
  sku: string
  category: string
  purity: string
  weight: number
  price: number
  stock: number
  status: "Active" | "Hidden"
  image?: string
}

type ProductForm = {
  name: string
  sku: string
  category: string
  purity: string
  weight: string
  price: string
  stock: string
  description: string
  images: File[]
}

/* =======================
   MOCK DATA
======================= */

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Gold Necklace Classic",
    sku: "GN-2211",
    category: "Gold",
    purity: "22K",
    weight: 15.6,
    price: 185000,
    stock: 12,
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300",
  },
]

/* =======================
   COMPONENT
======================= */

export default function ProductListTable() {
  const [products, setProducts] = React.useState<Product[]>(initialProducts)
  const [open, setOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [editingProduct, setEditingProduct] =
    React.useState<Product | null>(null)

  const [form, setForm] = React.useState<ProductForm>({
    name: "",
    sku: "",
    category: "",
    purity: "",
    weight: "",
    price: "",
    stock: "",
    description: "",
    images: [],
  })

  /* =======================
     TABLE
  ======================= */

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.original.image ||
              "https://placehold.co/60x60?text=IMG"
            }
            className="h-10 w-10 rounded object-cover border"
          />
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              SKU: {row.original.sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue("category")}</Badge>
      ),
    },
    {
      accessorKey: "purity",
      header: "Purity",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("purity")}</Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div className="font-medium">
          ৳{row.getValue<number>("price").toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.getValue<number>("stock")
        if (stock === 0) return <Badge variant="destructive">Out</Badge>
        if (stock < 5) return <Badge variant="outline">Low</Badge>
        return <Badge variant="secondary">In</Badge>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue("status") === "Active"
              ? "secondary"
              : "outline"
          }
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingProduct(product)
                  setForm({
                    name: product.name,
                    sku: product.sku,
                    category: product.category,
                    purity: product.purity,
                    weight: product.weight.toString(),
                    price: product.price.toString(),
                    stock: product.stock.toString(),
                    description: "",
                    images: [],
                  })
                  setOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === product.id
                        ? {
                            ...p,
                            status:
                              p.status === "Active"
                                ? "Hidden"
                                : "Active",
                          }
                        : p
                    )
                  )
                }
              >
                {product.status === "Active"
                  ? "Disable"
                  : "Enable"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  /* =======================
     IMAGE HANDLERS
  ======================= */

  const onDrop = (files: FileList | null) => {
    if (!files) return
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...Array.from(files)],
    }))
  }

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  /* =======================
     SUBMIT
  ======================= */

  const handleSubmit = () => {
    const image =
      form.images.length > 0
        ? URL.createObjectURL(form.images[0])
        : editingProduct?.image

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...{
                  name: form.name,
                  sku: form.sku,
                  category: form.category,
                  purity: form.purity,
                  weight: Number(form.weight),
                  price: Number(form.price),
                  stock: Number(form.stock),
                  image,
                },
              }
            : p
        )
      )
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: form.name,
          sku: form.sku,
          category: form.category,
          purity: form.purity,
          weight: Number(form.weight),
          price: Number(form.price),
          stock: Number(form.stock),
          status: "Active",
          image,
        },
      ])
    }

    setEditingProduct(null)
    setOpen(false)
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setOpen(true)}>Add Product</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ ADD / EDIT DIALOG (THIS FIXES EDIT) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Product Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <Input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) =>
                setForm({ ...form, sku: e.target.value })
              }
            />
            <Input
              placeholder="Weight"
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: e.target.value })
              }
            />
            <Input
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
            />
            <Input
              placeholder="Stock"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: e.target.value })
              }
            />
          </div>

          <div
            onDrop={(e) => {
              e.preventDefault()
              onDrop(e.dataTransfer.files)
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border border-dashed rounded-lg p-6 text-center"
          >
            <Upload className="mx-auto mb-2" />
            <Input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => onDrop(e.target.files)}
            />
            Drag & drop images or click
          </div>

          <div className="flex gap-3 flex-wrap">
            {form.images.map((file, i) => (
              <div key={i} className="relative h-20 w-20 border rounded">
                <img
                  src={URL.createObjectURL(file)}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/70 p-1 rounded-full"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? "Update Product" : "Save Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
