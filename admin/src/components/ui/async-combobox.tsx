"use client"

import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface AsyncComboboxOption {
  value: string
  label: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

interface AsyncComboboxProps {
  value?: string
  onValueChange: (value: string) => void
    // For static options (client-side filtering)
    options?: AsyncComboboxOption[]
    // For async options (server-side fetching)
    fetchOptions?: (query: string) => Promise<AsyncComboboxOption[]>
    // Debounce delay in ms (default 300ms)
    debounceMs?: number
  placeholder?: string
  searchPlaceholder?: string
    emptyText?: string
  disabled?: boolean
  className?: string
}

export function AsyncCombobox({
  value,
  onValueChange,
    options: staticOptions,
    fetchOptions,
    debounceMs = 300,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
    emptyText = "No results found.",
  disabled = false,
  className,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
    const [asyncOptions, setAsyncOptions] = React.useState<AsyncComboboxOption[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasSearched, setHasSearched] = React.useState(false)

    // Debounce the search query
    const debouncedQuery = useDebounce(searchQuery, debounceMs)

    // Determine which options to use
    const options = fetchOptions ? asyncOptions : staticOptions || []

    // Find selected option from both static and async options
    const selectedOption = React.useMemo(() => {
        // First check current options
        const found = options.find((option) => option.value === value)
        if (found) return found
        // If using static options and value exists, it might just not be filtered in
        if (staticOptions && value) {
            return staticOptions.find((option) => option.value === value)
        }
        return null
    }, [options, staticOptions, value])

    // Client-side filtering for static options
  const filteredOptions = React.useMemo(() => {
      if (fetchOptions) return asyncOptions // Server already filtered
      if (!searchQuery) return staticOptions || []
    const query = searchQuery.toLowerCase()
      return (staticOptions || []).filter((option) =>
      option.label.toLowerCase().includes(query)
    )
  }, [staticOptions, asyncOptions, fetchOptions, searchQuery])

    // Fetch options when debounced query changes (async mode only)
    React.useEffect(() => {
        if (!fetchOptions) return

        const fetchData = async () => {
            setIsLoading(true)
            setHasSearched(true)
            try {
                const results = await fetchOptions(debouncedQuery)
                setAsyncOptions(results)
            } catch (error) {
                console.error("Error fetching options:", error)
                setAsyncOptions([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [debouncedQuery, fetchOptions])

    // Initial load for async mode when opening
    React.useEffect(() => {
        if (fetchOptions && open && !hasSearched) {
            const fetchInitial = async () => {
                setIsLoading(true)
                try {
                    const results = await fetchOptions("")
                    setAsyncOptions(results)
                    setHasSearched(true)
                } catch (error) {
                    console.error("Error fetching initial options:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchInitial()
        }
    }, [open, fetchOptions, hasSearched])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
                  disabled={disabled}
        >
                  {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
                      {isLoading ? (
                          <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                      ) : filteredOptions.length === 0 ? (
                              <CommandEmpty>{emptyText}</CommandEmpty>
                          ) : (
                                  <CommandGroup>
                                      {filteredOptions.map((option) => (
                                          <CommandItem
                                              key={option.value}
                                              value={option.value}
                                              onSelect={() => {
                                                  onValueChange(option.value)
                                                  setOpen(false)
                                                  setSearchQuery("")
                                              }}
                                          >
                                              <Check
                                                  className={cn(
                                                      "mr-2 h-4 w-4",
                                                      value === option.value ? "opacity-100" : "opacity-0"
                                                  )}
                                              />
                                              {option.label}
                                          </CommandItem>
                                      ))}
                                  </CommandGroup>
                      )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
