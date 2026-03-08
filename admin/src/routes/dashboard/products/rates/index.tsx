import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { fmtDateTime, fmtDateTimeLong } from "@/lib/date"
import { Download, History, Loader2, Plus, RefreshCw, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { DailyRate, getCurrentRates, getRateHistory, syncBajusRates } from "@/api/rates"
import { DataTable } from "@/components/shared/data-table"
import { RateDialog } from "@/components/shared/rate-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export const Route = createFileRoute("/dashboard/products/rates/")({
    component: RatesPage,
})

function RatesPage() {
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [historyRate, setHistoryRate] = useState<DailyRate | null>(null)

    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['rate-history', historyRate?.metal_type, historyRate?.purity],
        queryFn: () => (getRateHistory as any)({ data: { metal_type: historyRate!.metal_type, purity: historyRate!.purity, limit: 50 } }),
        enabled: !!historyRate,
    })

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['rates'],
        queryFn: () => getCurrentRates(),
    })

    const handleRefresh = () => {
        refetch()
    }

    const syncMutation = useMutation({
        mutationFn: () => syncBajusRates(),
        onSuccess: (data) => {
            const result = data?.data
            toast.success(`Synced ${result?.synced ?? 0} rates from BAJUS`)
            queryClient.invalidateQueries({ queryKey: ['rates'] })
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to sync from BAJUS")
        },
    })

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
            cell: ({ row }) => fmtDateTime(row.getValue("effective_date")),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" onClick={() => setHistoryRate(row.original)}>
                    <History className="h-4 w-4 mr-1" />
                    History
                </Button>
            ),
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
                    <Button
                        variant="outline"
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                    >
                        {syncMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Sync from BAJUS
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
                            Last updated: {fmtDateTimeLong(lastUpdated)}
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

            <Sheet open={!!historyRate} onOpenChange={(open) => !open && setHistoryRate(null)}>
                <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {historyRate?.metal_type} {historyRate?.purity} — Rate History
                        </SheetTitle>
                        <SheetDescription>Last 50 entries, newest first</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        {historyLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="text-left pb-2">Date</th>
                                        <th className="text-right pb-2">Rate/Gram</th>
                                        <th className="text-right pb-2">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(historyData?.success ? historyData.data : [] as DailyRate[]).map((entry: DailyRate) => (
                                        <tr key={entry.id} className="border-b last:border-0">
                                            <td className="py-2 text-muted-foreground">{fmtDateTime(entry.effective_date)}</td>
                                            <td className="py-2 text-right font-semibold text-green-600">
                                                ৳{parseFloat(String(entry.rate_per_gram)).toLocaleString()}
                                            </td>
                                            <td className="py-2 text-right">
                                                <Badge variant={entry.source === "BAJUS" ? "default" : "outline"}>
                                                    {entry.source}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
