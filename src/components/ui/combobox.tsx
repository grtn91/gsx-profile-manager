import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[]
    value: string | null
    onChange: (value: string | null) => void
    placeholder?: string
    emptyText?: string
    triggerPlaceholder?: string
}

export function Combobox({
    options = [], // Provide default empty array
    value,
    onChange,
    placeholder = "Search...",
    emptyText = "No results found.",
    triggerPlaceholder = "Select option"
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    // Ensure options is always a valid array and each option has valid values
    const safeOptions = React.useMemo(() => {
        try {
            if (!Array.isArray(options)) return [];

            return options.filter(
                option => option &&
                    typeof option === 'object' &&
                    option !== null &&
                    typeof option.value === 'string' &&
                    typeof option.label === 'string'
            );
        } catch (error) {
            console.error("Error processing combobox options:", error);
            return [];
        }
    }, [options]);

    // Fix value if it's invalid
    const displayValue = React.useMemo(() => {
        if (!value) return null;

        const foundOption = safeOptions.find(option => option.value === value);
        return foundOption ? value : null;
    }, [value, safeOptions]);

    // Ensure the value exists in the options, otherwise reset it
    React.useEffect(() => {
        if (value && !displayValue) {
            onChange(null);
        }
    }, [value, displayValue, onChange]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="min-w-[180px] justify-between"
                >
                    {displayValue
                        ? safeOptions.find(option => option.value === displayValue)?.label || triggerPlaceholder
                        : triggerPlaceholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                {safeOptions.length > 0 ? (
                    <Command shouldFilter={true}>
                        <CommandInput placeholder={placeholder} />
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {safeOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? null : currentValue);
                                        setOpen(false);
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
                    </Command>
                ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">{emptyText}</div>
                )}
            </PopoverContent>
        </Popover>
    )
}