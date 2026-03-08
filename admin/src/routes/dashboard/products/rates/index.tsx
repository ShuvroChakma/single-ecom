import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { fmtDateTime, fmtDateTimeLong } from "@/lib/date"
import { ArrowDown, ArrowUp, Download, History, Loader2, Minus, Plus, RefreshCw, TrendingUp } from "lucide-react"
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
                <SheetContent className="w-[520px] sm:w-[580px] overflow-y-auto p-0 bg-slate-950 border-slate-800">
                    {/* Header */}
                    <div className="relative px-6 pt-8 pb-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                        <div className="absolute inset-0 opacity-5"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
                        <SheetHeader className="relative">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-amber-400" />
                                </div>
                                <SheetTitle className="text-slate-100 text-xl font-mono tracking-tight">
                                    {historyRate?.metal_type} <span className="text-amber-400">{historyRate?.purity}</span>
                                </SheetTitle>
                            </div>
                            <SheetDescription className="text-slate-500 text-xs font-mono ml-11">
                                RATE HISTORY · LAST 50 ENTRIES · NEWEST FIRST
                            </SheetDescription>
                        </SheetHeader>

                        {/* Stats row */}
                        {!historyLoading && historyData?.success && historyData.data.length > 0 && (() => {
                            const entries = historyData.data as DailyRate[]
                            const latest = parseFloat(String(entries[0].rate_per_gram))
                            const oldest = parseFloat(String(entries[entries.length - 1].rate_per_gram))
                            const totalChange = latest - oldest
                            return (
                                <div className="grid grid-cols-3 gap-3 mt-5 ml-11">
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Current</p>
                                        <p className="text-lg font-mono font-bold text-amber-400">৳{latest.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Entries</p>
                                        <p className="text-lg font-mono font-bold text-slate-300">{entries.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Net Change</p>
                                        <p className={`text-lg font-mono font-bold ${totalChange > 0 ? 'text-emerald-400' : totalChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                            {totalChange > 0 ? '+' : ''}{totalChange.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Timeline */}
                    <div className="px-6 py-4">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-amber-500/50" />
                                <p className="text-[11px] text-slate-600 font-mono tracking-widest">LOADING HISTORY</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Timeline spine */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />

                                <div className="space-y-1">
                                    {(historyData?.success ? historyData.data : [] as DailyRate[]).map((entry: DailyRate, idx: number) => {
                                        const entries = historyData?.success ? historyData.data as DailyRate[] : []
                                        const curr = parseFloat(String(entry.rate_per_gram))
                                        const prev = idx < entries.length - 1 ? parseFloat(String(entries[idx + 1].rate_per_gram)) : null
                                        const delta = prev !== null ? curr - prev : null
                                        const isLatest = idx === 0

                                        return (
                                            <div key={entry.id} className="relative flex gap-4 pl-6 py-2.5 rounded-lg hover:bg-slate-900/60 transition-colors group">
                                                {/* Timeline dot */}
                                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center z-10
                                                    ${isLatest ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'}`} />

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-mono font-bold text-base text-slate-100 tabular-nums">
                                                            ৳{curr.toLocaleString()}
                                                        </span>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {delta !== null && (
                                                                <span className={`flex items-center gap-0.5 text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded
                                                                    ${delta > 0 ? 'text-emerald-400 bg-emerald-400/10' : delta < 0 ? 'text-red-400 bg-red-400/10' : 'text-slate-500 bg-slate-800'}`}>
                                                                    {delta > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : delta < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                                                                    {Math.abs(delta).toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border
                                                                ${entry.source === 'BAJUS' ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>
                                                                {entry.source}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">{fmtDateTime(entry.effective_date)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {(!historyData?.success || (historyData.data as DailyRate[]).length === 0) && (
                                    <div className="flex flex-col items-center py-16 gap-2">
                                        <p className="text-slate-600 font-mono text-xs tracking-widest">NO HISTORY FOUND</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
