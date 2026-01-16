import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Plus, RefreshCw, TrendingUp } from "lucide-react"
import { useState } from "react"

import { DailyRate, getCurrentRates } from "@/api/rates"
import { DataTable } from "@/components/shared/data-table"
import { RateDialog } from "@/components/shared/rate-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/dashboard/products/rates/")({
    component: RatesPage,
})

function RatesPage() {
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['rates'],
        queryFn: () => getCurrentRates(),
    })

    const handleRefresh = () => {
        refetch()
    }

    const columns: ColumnDef<DailyRate>[] = [
        {
            accessorKey: "metal_type",
            header: "Metal Type",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{row.getValue("metal_type")}</span>
                </div>
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
            accessorKey: "rate_per_gram",
            header: "Rate/Gram",
            cell: ({ row }) => {
                const rate = parseFloat(row.getValue("rate_per_gram"))
                const currency = row.original.currency
                return (
                    <span className="font-semibold text-green-600">
                        {currency} {rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                )
            },
        },
        {
            accessorKey: "currency",
            header: "Currency",
        },
        {
            accessorKey: "source",
            header: "Source",
            cell: ({ row }) => {
                const source = row.getValue("source") as string
                const variant = source === "BAJUS" ? "default" : source === "API" ? "secondary" : "outline"
                return <Badge variant={variant}>{source}</Badge>
            },
        },
        {
            accessorKey: "effective_date",
            header: "Effective Date",
            cell: ({ row }) => format(new Date(row.getValue("effective_date")), "MMM d, yyyy HH:mm"),
        },
    ]

    const rates = data?.success ? data.data.rates : []
    const lastUpdated = data?.success ? data.data.last_updated : null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Daily Rates</h1>
                    <p className="text-muted-foreground">
                        Manage metal rates and pricing
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={isRefetching}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Rate
                    </Button>
                </div>
            </div>

            {lastUpdated && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Current Rates</CardTitle>
                        <CardDescription>
                            Last updated: {format(new Date(lastUpdated), "MMMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {rates.slice(0, 4).map((rate) => (
                                <div key={rate.id} className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">{rate.metal_type} {rate.purity}</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ৳{parseFloat(String(rate.rate_per_gram)).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">per gram</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <DataTable
                columns={columns}
                data={rates}
                isLoading={isLoading}
            />

            <RateDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    )
}
