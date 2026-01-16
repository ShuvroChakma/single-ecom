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
    // Async function to fetch options from server
    fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>
    // Debounce delay in ms (default 300ms)
    debounceMs?: number
  placeholder?: string
  searchPlaceholder?: string
    emptyText?: string
  disabled?: boolean
  className?: string
    // Optional: provide initial selected option to display label before fetch
    initialOption?: AsyncComboboxOption
}

export function AsyncCombobox({
  value,
    onValueChange,
    fetchOptions,
    debounceMs = 300,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
    emptyText = "No results found.",
  disabled = false,
  className,
    initialOption,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
    const [options, setOptions] = React.useState<AsyncComboboxOption[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasInitialLoad, setHasInitialLoad] = React.useState(false)
    const [selectedLabel, setSelectedLabel] = React.useState<string | null>(
        initialOption?.label || null
    )

    // Debounce the search query
    const debouncedQuery = useDebounce(searchQuery, debounceMs)

    // Find selected option from current options
    const selectedOption = React.useMemo(() => {
      if (!value) return null
      const found = options.find((option) => option.value === value)
      if (found) {
          return found
      }
      // Return a temporary option with the stored label
      if (selectedLabel) {
          return { value, label: selectedLabel }
      }
      return null
  }, [options, value, selectedLabel])

    // Fetch options when debounced query changes
    React.useEffect(() => {
      if (!open) return

      const fetchData = async () => {
          setIsLoading(true)
        try {
            const results = await fetchOptions(debouncedQuery)
          setOptions(results)
      } catch (error) {
          console.error("Error fetching options:", error)
            setOptions([])
        } finally {
            setIsLoading(false)
        }
    }

      fetchData()
  }, [debouncedQuery, fetchOptions, open])

    // Initial load when opening
    React.useEffect(() => {
      if (open && !hasInitialLoad) {
          const fetchInitial = async () => {
              setIsLoading(true)
              try {
                  const results = await fetchOptions("")
                setOptions(results)
                setHasInitialLoad(true)
            } catch (error) {
                console.error("Error fetching initial options:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchInitial()
    }
  }, [open, fetchOptions, hasInitialLoad])

    const handleSelect = (option: AsyncComboboxOption) => {
        onValueChange(option.value)
        setSelectedLabel(option.label)
        setOpen(false)
        setSearchQuery("")
    }

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
                      ) : options.length === 0 ? (
                          <CommandEmpty>{emptyText}</CommandEmpty>
                      ) : (
                          <CommandGroup>
                                      {options.map((option) => (
                                          <CommandItem
                                              key={option.value}
                                              value={option.value}
                        onSelect={() => handleSelect(option)}
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
