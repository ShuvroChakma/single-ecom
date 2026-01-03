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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  },
]

/* =======================
   COMPONENT
======================= */

export default function ProductListTable() {
  const [products, setProducts] = React.useState(initialProducts)
  const [open, setOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")

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
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-xs text-muted-foreground">
            SKU: {row.original.sku}
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
      id: "actions",
      header: "",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Disable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = () => {
    setProducts([
      ...products,
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
      },
    ])
    setOpen(false)
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setOpen(true)}>Add Product</Button>
      </div>

      {/* Table */}
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

      {/* Add Product Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Product Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="SKU" onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <Input placeholder="Weight (gm)" onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <Input placeholder="Price" onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="Stock" onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>

          {/* Drag & Drop */}
          <div
            onDrop={(e) => {
              e.preventDefault()
              onDrop(e.dataTransfer.files)
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border border-dashed rounded-lg p-6 text-center cursor-pointer"
          >
            <Upload className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop images or click to upload
            </p>
            <Input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => onDrop(e.target.files)}
            />
          </div>

          {/* Preview */}
          <div className="flex gap-3 flex-wrap">
            {form.images.map((file, i) => (
              <div key={i} className="relative h-20 w-20 border rounded">
                <img
                  src={URL.createObjectURL(file)}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
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
            <Button onClick={handleSubmit}>Save Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
