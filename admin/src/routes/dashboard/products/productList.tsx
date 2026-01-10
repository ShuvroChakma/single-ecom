import { createFileRoute } from '@tanstack/react-router'
import ProductListTable from '@/components/shared/pages/product-table'


export const Route = createFileRoute('/dashboard/products/productList')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
   <ProductListTable />
  </div>
}
