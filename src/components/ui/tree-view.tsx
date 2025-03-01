import React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const treeVariants = cva(
    'group hover:before:opacity-100 before:absolute before:rounded-lg before:left-0 px-2 before:w-full before:opacity-0 before:bg-accent/70 before:h-[2rem] before:-z-10'
)

const selectedTreeVariants = cva(
    'before:opacity-100 before:bg-accent/70 text-accent-foreground'
)

// Add this new variant for selected files
const selectedFileVariants = cva(
    'before:opacity-100 before:bg-green-200 dark:before:bg-green-900 text-green-800 dark:text-green-300'
)

interface TreeDataItem {
    id: string
    name: string
    icon?: any
    selectedIcon?: any
    openIcon?: any
    children?: TreeDataItem[]
    actions?: React.ReactNode
    onClick?: () => void
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
    data: TreeDataItem[] | TreeDataItem
    initialSelectedItemIds?: string[] // Changed to array
    onSelectChange?: (item: TreeDataItem | undefined) => void
    expandAll?: boolean
    defaultNodeIcon?: any
    defaultLeafIcon?: any
    selectedItemIds?: string[] // External control for selected items
    expandedIds?: string[] // External control for expanded items
    onExpandedIdsChange?: (ids: string[]) => void // Callback when expanded items change
}

const TreeView = React.forwardRef<HTMLDivElement, TreeProps>(
    (
        {
            data,
            initialSelectedItemIds = [], // Default to empty array
            onSelectChange,
            expandAll,
            defaultLeafIcon,
            defaultNodeIcon,
            className,
            selectedItemIds: externalSelectedItemIds, // External selected items
            expandedIds: externalExpandedIds, // External expanded items
            onExpandedIdsChange, // Callback for expanded items
            ...props
        },
        ref
    ) => {
        const [internalSelectedItemIds, setInternalSelectedItemIds] = React.useState<string[]>(
            initialSelectedItemIds
        )

        // Internal expanded items state
        const [internalExpandedIds, setInternalExpandedIds] = React.useState<string[]>([])
        
        // Use external IDs if provided, otherwise use internal state
        const selectedItemIds = externalSelectedItemIds || internalSelectedItemIds

        // Handle selection change
        const handleSelectChange = React.useCallback(
            (item: TreeDataItem | undefined) => {
                if (!item) return
                
                // If no external control, manage internally
                if (!externalSelectedItemIds) {
                    setInternalSelectedItemIds(prev => {
                        // Toggle selection: if already selected, remove it; otherwise add it
                        const isSelected = prev.includes(item.id)
                        if (isSelected) {
                            return prev.filter(id => id !== item.id)
                        } else {
                            return [...prev, item.id]
                        }
                    })
                }
                
                // Call the external handler if provided
                if (onSelectChange) {
                    onSelectChange(item)
                }
            },
            [onSelectChange, externalSelectedItemIds]
        )

        // Handle expansion change
        const handleExpandedChange = React.useCallback((itemId: string, isExpanded: boolean) => {
            const updateExpanded = (prev: string[]) => {
                if (isExpanded) {
                    if (!prev.includes(itemId)) {
                        return [...prev, itemId];
                    }
                } else {
                    return prev.filter(id => id !== itemId);
                }
                return prev;
            };

            // Update internal state if no external control
            if (!externalExpandedIds) {
                setInternalExpandedIds(prev => updateExpanded(prev));
            }

            // Call external handler if provided
            if (onExpandedIdsChange) {
                // Calculate the new expanded IDs
                const newExpandedIds = updateExpanded(externalExpandedIds || internalExpandedIds);
                onExpandedIdsChange(newExpandedIds);
            }
        }, [externalExpandedIds, internalExpandedIds, onExpandedIdsChange]);

        // Calculate expanded item IDs if not externally controlled
        const calculatedExpandedIds = React.useMemo(() => {
            // If external control is provided, use it
            if (externalExpandedIds) {
                return externalExpandedIds;
            }

            // If expandAll is true, calculate all folder IDs
            if (expandAll) {
                const ids: string[] = [];
                
                const collectIds = (items: TreeDataItem[] | TreeDataItem) => {
                    if (items instanceof Array) {
                        for (const item of items) {
                            if (item.children) {
                                ids.push(item.id);
                                collectIds(item.children);
                            }
                        }
                    } else if (items.children) {
                        ids.push(items.id);
                        collectIds(items.children);
                    }
                };
                
                collectIds(data);
                return ids;
            }

            // Otherwise use the internal state
            return internalExpandedIds;
        }, [data, expandAll, externalExpandedIds, internalExpandedIds]);

        return (
            <div className={cn('overflow-hidden relative p-2', className)}>
                <TreeItem
                    data={data}
                    ref={ref}
                    selectedItemIds={selectedItemIds}
                    handleSelectChange={handleSelectChange}
                    expandedItemIds={calculatedExpandedIds}
                    handleExpandedChange={handleExpandedChange}
                    defaultLeafIcon={defaultLeafIcon}
                    defaultNodeIcon={defaultNodeIcon}
                    {...props}
                />
            </div>
        )
    }
)
TreeView.displayName = 'TreeView'

type TreeItemProps = TreeProps & {
    selectedItemIds: string[] // Changed to array
    handleSelectChange: (item: TreeDataItem | undefined) => void
    expandedItemIds: string[]
    handleExpandedChange: (itemId: string, isExpanded: boolean) => void
    defaultNodeIcon?: any
    defaultLeafIcon?: any
}

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
    (
        {
            className,
            data,
            selectedItemIds,
            handleSelectChange,
            expandedItemIds,
            handleExpandedChange,
            defaultNodeIcon,
            defaultLeafIcon,
            ...props
        },
        ref
    ) => {
        if (!(data instanceof Array)) {
            data = [data]
        }
        return (
            <div ref={ref} role="tree" className={className} {...props}>
                <ul>
                    {data.map((item) => (
                        <li key={item.id}>
                            {item.children ? (
                                <TreeNode
                                    item={item}
                                    selectedItemIds={selectedItemIds}
                                    expandedItemIds={expandedItemIds}
                                    handleSelectChange={handleSelectChange}
                                    handleExpandedChange={handleExpandedChange}
                                    defaultNodeIcon={defaultNodeIcon}
                                    defaultLeafIcon={defaultLeafIcon}
                                />
                            ) : (
                                <TreeLeaf
                                    item={item}
                                    selectedItemIds={selectedItemIds}
                                    handleSelectChange={handleSelectChange}
                                    defaultLeafIcon={defaultLeafIcon}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        )
    }
)
TreeItem.displayName = 'TreeItem'

const TreeNode = ({
    item,
    handleSelectChange,
    expandedItemIds,
    handleExpandedChange,
    selectedItemIds,
    defaultNodeIcon,
    defaultLeafIcon
}: {
    item: TreeDataItem
    handleSelectChange: (item: TreeDataItem | undefined) => void
    expandedItemIds: string[]
    handleExpandedChange: (itemId: string, isExpanded: boolean) => void
    selectedItemIds: string[] // Changed to array
    defaultNodeIcon?: any
    defaultLeafIcon?: any
}) => {
    // Use the expandedItemIds prop to determine if this node is expanded
    const isExpanded = expandedItemIds.includes(item.id);
    const [value, setValue] = React.useState<string[]>(
        isExpanded ? [item.id] : []
    );

    // Update internal state when expandedItemIds changes
    React.useEffect(() => {
        setValue(isExpanded ? [item.id] : []);
    }, [isExpanded, item.id]);
    
    const isSelected = selectedItemIds.includes(item.id);
    
    return (
        <AccordionPrimitive.Root
            type="multiple"
            value={value}
            onValueChange={(newValue) => {
                setValue(newValue);
                // Notify parent about expansion change
                handleExpandedChange(item.id, newValue.includes(item.id));
            }}
        >
            <AccordionPrimitive.Item value={item.id}>
                <AccordionTrigger
                    className={cn(
                        treeVariants(),
                        isSelected && selectedTreeVariants()
                    )}
                    onClick={(e) => {
                        // Prevent accordion from toggling when clicking the item text
                        e.stopPropagation();
                        handleSelectChange(item);
                        item.onClick?.();
                    }}
                >
                    <TreeIcon
                        item={item}
                        isSelected={isSelected}
                        isOpen={value.includes(item.id)}
                        default={defaultNodeIcon}
                    />
                    <span className="text-sm truncate">{item.name}</span>
                    <TreeActions isSelected={isSelected}>
                        {item.actions}
                    </TreeActions>
                </AccordionTrigger>
                <AccordionContent className="ml-4 pl-1 border-l">
                    <TreeItem
                        data={item.children ? item.children : item}
                        selectedItemIds={selectedItemIds}
                        handleSelectChange={handleSelectChange}
                        expandedItemIds={expandedItemIds}
                        handleExpandedChange={handleExpandedChange}
                        defaultLeafIcon={defaultLeafIcon}
                        defaultNodeIcon={defaultNodeIcon}
                    />
                </AccordionContent>
            </AccordionPrimitive.Item>
        </AccordionPrimitive.Root>
    )
}

const TreeLeaf = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        item: TreeDataItem
        selectedItemIds: string[] // Changed to array
        handleSelectChange: (item: TreeDataItem | undefined) => void
        defaultLeafIcon?: any
    }
>(
    (
        {
            className,
            item,
            selectedItemIds,
            handleSelectChange,
            defaultLeafIcon,
            ...props
        },
        ref
    ) => {
        const isSelected = selectedItemIds.includes(item.id)
        
        return (
            <div
                ref={ref}
                className={cn(
                    'ml-5 flex text-left items-center py-2 cursor-pointer before:right-1',
                    treeVariants(),
                    className,
                    isSelected && selectedFileVariants() // Use the new variant for files
                )}
                onClick={() => {
                    handleSelectChange(item)
                    item.onClick?.()
                }}
                {...props}
            >
                <TreeIcon
                    item={item}
                    isSelected={isSelected}
                    default={defaultLeafIcon}
                />
                <span className="flex-grow text-sm truncate">{item.name}</span>
            </div>
        )
    }
)
TreeLeaf.displayName = 'TreeLeaf'

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                'flex flex-1 w-full items-center py-2 transition-all first:[&[data-state=open]>svg]:rotate-90',
                className
            )}
            {...props}
        >
            <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 text-accent-foreground/50 mr-1" />
            {children}
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className={cn(
            'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
            className
        )}
        {...props}
    >
        <div className="pb-1 pt-0">{children}</div>
    </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

const TreeIcon = ({
    item,
    isOpen,
    isSelected,
    default: defaultIcon
}: {
    item: TreeDataItem
    isOpen?: boolean
    isSelected?: boolean
    default?: any
}) => {
    let Icon = defaultIcon
    if (isSelected && item.selectedIcon) {
        Icon = item.selectedIcon
    } else if (isOpen && item.openIcon) {
        Icon = item.openIcon
    } else if (item.icon) {
        Icon = item.icon
    }
    return Icon ? (
        <Icon className="h-4 w-4 shrink-0 mr-2" />
    ) : (
        <></>
    )
}

const TreeActions = ({
    children,
    isSelected,
}: {
    children: React.ReactNode
    isSelected: boolean
}) => {
    return (
        <div
            className={cn(
                isSelected ? 'block' : 'hidden',
                'absolute right-3 group-hover:block flex items-center gap-2'
            )}
        >
            {children}
        </div>
    )
}

export { TreeView, type TreeDataItem }