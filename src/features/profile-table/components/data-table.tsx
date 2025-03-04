import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, FileIcon, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useProfileStore } from "@/store/useGsxProfileStore"
import { GSXProfile, SyncStatus } from "@/types/gsx-profile"
import { getRelativePath } from "../utils/helper"
import { dirname } from "@tauri-apps/api/path"
import { open } from "@tauri-apps/plugin-shell";

export const columns: ColumnDef<GSXProfile>[] = [
  {
    id: "sync",
    header: "Sync",
    cell: ({ row }) => {
      const profile = row.original
      const { syncProfile, unsyncProfile } = useProfileStore()

      // Handle toggling sync status
      const handleToggleSync = async (checked: boolean) => {
        try {
          if (checked) {
            await syncProfile(profile.id)
            toast.success(`${profile.airportIcaoCode} profile synced`)
          } else {
            await unsyncProfile(profile.id)
            toast.success(`${profile.airportIcaoCode} profile unsynced`)
          }
        } catch (error) {
          toast.error(`Failed to update profile status: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      return (
        <Checkbox
          checked={profile.status}
          onCheckedChange={handleToggleSync}
          aria-label="Toggle sync status"
        />
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.original.status

      return (
        <Badge variant={status ? "default" : "outline"} className="capitalize">
          {status ? SyncStatus.SYNCED : SyncStatus.NOT_SYNCED}
        </Badge>
      )
    },
  },
  {
    accessorKey: "continent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Continent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("continent")}</div>,
  },
  {
    accessorKey: "country",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Country
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("country")}</div>,
  },
  {
    accessorKey: "airportIcaoCode",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ICAO Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="uppercase font-medium">{row.getValue("airportIcaoCode")}</div>,
  },
  {
    accessorKey: "airportDeveloper",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Developer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const developer = row.getValue("airportDeveloper");
      return <>{developer || "—"}</>;
    },
  },
  {
    accessorKey: "profileVersion",
    header: "Version",
    cell: ({ row }) => {
      const version = row.getValue("profileVersion")
      return <>{version || "—"}</>
    },
  },
  {
    accessorKey: "filePaths",
    header: "Files",
    cell: ({ row }) => {
      const filePaths = row.getValue("filePaths") as string[]

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2" />
                <span>{filePaths.length} file(s)</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-md">
              <div className="space-y-1 text-xs">
                {filePaths.map((path, index) => {
                  const relativePath = getRelativePath(path);
                  return (
                    <div
                      key={index}
                      className="truncate hover:text-blue-500 cursor-pointer"
                      onClick={async () => {
                        try {
                          // Get the directory name and open it
                          const folderPath = await dirname(path);
                          await open(folderPath);
                        } catch (error) {
                          toast.error(`Failed to open folder: ${error}`);
                        }
                      }}
                    >
                      {relativePath}
                    </div>
                  );
                })}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const profile = row.original
      const { removeProfile } = useProfileStore()

      const handleDelete = async () => {
        try {

          await removeProfile(profile.id)
          toast.success(`Profile for ${profile.airportIcaoCode} deleted successfully`)

        } catch (error) {
          toast.error(`Failed to delete profile: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              Delete profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
]

export function GsxProfilesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const { profiles, initializeStore } = useProfileStore();

  // Initialize the store when the component mounts
  React.useEffect(() => {
    initializeStore().catch(err =>
      toast.error(`Failed to load profiles: ${err instanceof Error ? err.message : String(err)}`)
    );
  }, [initializeStore]);

  const table = useReactTable({
    data: profiles || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  // Calculate synced profiles count
  const syncedCount = React.useMemo(() => {
    return profiles?.filter(p => p.status).length || 0;
  }, [profiles]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by ICAO code..."
          value={(table.getColumn("airportIcaoCode")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("airportIcaoCode")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="ml-auto flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.original.status && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No profiles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {syncedCount} of {profiles?.length || 0} profile(s) synced.
        </div>
        <div className="hidden space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}