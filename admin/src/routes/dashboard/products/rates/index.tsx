import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { fmtDateTime, fmtDateTimeLong } from "@/lib/date"
import { ArrowDown, ArrowUp, CalendarIcon, ChevronLeft, ChevronRight, Download, History, Loader2, Minus, Plus, RefreshCw, TrendingUp, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

import { DailyRate, getCurrentRates, getRateHistory, RateHistoryPage, syncBajusRates } from "@/api/rates"
import { DataTable } from "@/components/shared/data-table"
import { RateDialog } from "@/components/shared/rate-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/dashboard/products/rates/")({
    component: RatesPage,
})

function RatesPage() {
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [historyRate, setHistoryRate] = useState<DailyRate | null>(null)
    const [historyPage, setHistoryPage] = useState(0)
    const [historyDate, setHistoryDate] = useState<Date | undefined>(undefined)
    const PAGE_SIZE = 20

    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['rate-history', historyRate?.metal_type, historyRate?.purity, historyPage, historyDate?.toISOString()],
        queryFn: () => (getRateHistory as any)({ data: {
            metal_type: historyRate!.metal_type,
            purity: historyRate!.purity,
            limit: PAGE_SIZE,
            offset: historyPage * PAGE_SIZE,
            date: historyDate ? format(historyDate, 'yyyy-MM-dd') : undefined,
        }}),
        enabled: !!historyRate,
    })

    function openHistory(rate: DailyRate) {
        setHistoryRate(rate)
        setHistoryPage(0)
        setHistoryDate(undefined)
    }

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
                <Button variant="ghost" size="sm" onClick={() => openHistory(row.original)}>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <SheetContent className="w-[520px] sm:w-[580px] flex flex-col p-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b shrink-0">
                        <SheetHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center">
                                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                                <SheetTitle className="text-lg">
                                    {historyRate?.metal_type} <span className="text-amber-600">{historyRate?.purity}</span> Rate History
                                </SheetTitle>
                            </div>
                            <SheetDescription className="ml-9">
                                {historyData?.success ? `${(historyData.data as RateHistoryPage).total} total entries` : 'Loading…'}
                            </SheetDescription>
                        </SheetHeader>

                        {/* Stats */}
                        {!historyLoading && historyData?.success && (historyData.data as RateHistoryPage).items.length > 0 && (() => {
                            const page = historyData.data as RateHistoryPage
                            const latest = parseFloat(String(page.items[0].rate_per_gram))
                            return (
                                <div className="flex items-center gap-6 mt-4 ml-9">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Latest Rate</p>
                                        <p className="text-xl font-bold text-green-600 tabular-nums">৳{latest.toLocaleString()}</p>
                                    </div>
                                    <Separator orientation="vertical" className="h-8" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Records</p>
                                        <p className="text-xl font-bold tabular-nums">{page.total}</p>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-3 border-b bg-muted/30 shrink-0 flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-xs">
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {historyDate ? format(historyDate, 'dd MMM yyyy') : 'Filter by date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={historyDate}
                                    onSelect={(d) => { setHistoryDate(d); setHistoryPage(0) }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {historyDate && (
                            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground"
                                onClick={() => { setHistoryDate(undefined); setHistoryPage(0) }}>
                                <X className="h-3 w-3" /> Clear
                            </Button>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Loading history…</p>
                            </div>
                        ) : (() => {
                            const page = historyData?.success ? historyData.data as RateHistoryPage : null
                            const items = page?.items ?? []
                            if (items.length === 0) return (
                                <div className="flex flex-col items-center py-16 gap-1">
                                    <History className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">No entries found</p>
                                    {historyDate && <p className="text-xs text-muted-foreground">Try a different date</p>}
                                </div>
                            )
                            return (
                                <div className="relative">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                                    <div className="space-y-1">
                                        {items.map((entry: DailyRate, idx: number) => {
                                            const curr = parseFloat(String(entry.rate_per_gram))
                                            const prev = idx < items.length - 1 ? parseFloat(String(items[idx + 1].rate_per_gram)) : null
                                            const delta = prev !== null ? curr - prev : null
                                            const isFirst = idx === 0 && historyPage === 0
                                            return (
                                                <div key={entry.id} className="relative flex gap-4 pl-6 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 z-10 transition-colors
                                                        ${isFirst ? 'bg-amber-500 border-amber-500' : 'bg-background border-border group-hover:border-foreground/40'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-semibold text-sm tabular-nums">৳{curr.toLocaleString()}</span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {delta !== null && (
                                                                    <span className={`flex items-center gap-0.5 text-[11px] tabular-nums px-1.5 py-0.5 rounded font-medium
                                                                        ${delta > 0 ? 'text-emerald-600 bg-emerald-50' : delta < 0 ? 'text-red-600 bg-red-50' : 'text-muted-foreground bg-muted'}`}>
                                                                        {delta > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : delta < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                                                                        {Math.abs(delta).toLocaleString()}
                                                                    </span>
                                                                )}
                                                                <Badge variant={entry.source === 'BAJUS' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
                                                                    {entry.source}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(entry.effective_date)}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Pagination */}
                    {historyData?.success && (() => {
                        const page = historyData.data as RateHistoryPage
                        const totalPages = Math.ceil(page.total / PAGE_SIZE)
                        if (totalPages <= 1) return null
                        return (
                            <div className="px-6 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    {historyPage * PAGE_SIZE + 1}–{Math.min((historyPage + 1) * PAGE_SIZE, page.total)} of {page.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7"
                                        disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)}>
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="text-xs px-2 text-muted-foreground">{historyPage + 1} / {totalPages}</span>
                                    <Button variant="outline" size="icon" className="h-7 w-7"
                                        disabled={historyPage >= totalPages - 1} onClick={() => setHistoryPage(p => p + 1)}>
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })()}
                </SheetContent>
            </Sheet>
        </div>
    )
}
