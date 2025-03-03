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

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

// Define the GSX Profile type
export type GsxProfile = {
  id: string
  status: "synched" | "not-synched"
  continent: string
  country: string
  icaoCode: string
  airportDeveloper?: string  // Add this field
  profileVersion?: string
  filePaths: string[]
}

// Sample data - replace with actual data in production
// Update the sample data to include airportDeveloper values
const data: GsxProfile[] = [
  {
    id: "prof-1",
    status: "synched",
    continent: "Europe",
    country: "Germany",
    icaoCode: "EDDF",
    airportDeveloper: "Aerosoft",  // Add developer info
    profileVersion: "1.0.0",
    filePaths: [
      "/gsx_profiles/Europe/Germany/EDDF/Aerosoft/1.0.0/profile.py",
      "/gsx_profiles/Europe/Germany/EDDF/Aerosoft/1.0.0/settings.ini"
    ]
  },
  {
    id: "prof-2",
    status: "not-synched",
    continent: "North America",
    country: "United States",
    icaoCode: "KJFK",
    airportDeveloper: "FlyTampa",
    profileVersion: "2.1.3",
    filePaths: [
      "/gsx_profiles/North America/United States/KJFK/FlyTampa/2.1.3/profile.py"
    ]
  },
  {
    id: "prof-3",
    status: "synched",
    continent: "Asia",
    country: "Japan",
    icaoCode: "RJTT",
    airportDeveloper: "FS Design",
    profileVersion: "1.2.0",
    filePaths: [
      "/gsx_profiles/Asia/Japan/RJTT/FS Design/1.2.0/profile.py",
      "/gsx_profiles/Asia/Japan/RJTT/FS Design/1.2.0/settings.ini",
      "/gsx_profiles/Asia/Japan/RJTT/FS Design/1.2.0/custom.ini"
    ]
  },
  {
    id: "prof-4",
    status: "synched",
    continent: "Europe",
    country: "United Kingdom",
    icaoCode: "EGLL",
    airportDeveloper: "UK2000",
    filePaths: [
      "/gsx_profiles/Europe/United Kingdom/EGLL/UK2000/profile.py",
      "/gsx_profiles/Europe/United Kingdom/EGLL/UK2000/settings.ini"
    ]
  },
  {
    id: "prof-5",
    status: "not-synched",
    continent: "Oceania",
    country: "Australia",
    icaoCode: "YSSY",
    airportDeveloper: "Orbx",
    profileVersion: "1.0.1",
    filePaths: [
      "/gsx_profiles/Oceania/Australia/YSSY/Orbx/1.0.1/profile.py"
    ]
  },
  // Keep the rest of your sample data, adding airportDeveloper as needed
  {
    id: "prof-6",
    status: "not-synched",
    continent: "Oceania",
    country: "Australia",
    icaoCode: "YSSY",
    airportDeveloper: "Orbx",
    profileVersion: "1.0.1",
    filePaths: [
      "/gsx_profiles/Oceania/Australia/YSSY/Orbx/1.0.1/profile.py"
    ]
  },
  {
    id: "prof-7",
    status: "not-synched",
    continent: "Oceania",
    country: "Australia",
    icaoCode: "YSSY",
    airportDeveloper: "DD Design",
    profileVersion: "1.0.1",
    filePaths: [
      "/gsx_profiles/Oceania/Australia/YSSY/DD Design/1.0.1/profile.py"
    ]
  },
  {
    id: "prof-8",
    status: "not-synched",
    continent: "Oceania",
    country: "Australia",
    icaoCode: "YSSY",
    profileVersion: "1.0.1",
    filePaths: [
      "/gsx_profiles/Oceania/Australia/YSSY/profile.py"
    ]
  },
]

export const columns: ColumnDef<GsxProfile>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      return (
        <Badge variant={status === "synched" ? "default" : "destructive"} className="capitalize">
          {status === "synched" ? "Synched" : "Not Synched"}
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
    cell: ({ row }) => <div>{row.getValue("continent")}</div>,
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
    cell: ({ row }) => <div>{row.getValue("country")}</div>,
  },
  {
    accessorKey: "icaoCode",
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
    cell: ({ row }) => <div className="uppercase font-medium">{row.getValue("icaoCode")}</div>,
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
                {filePaths.map((path, index) => (
                  <div key={index} className="truncate">
                    {path}
                  </div>
                ))}
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

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Replace Button with a div that has button styling */}
            <div className="flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-accent cursor-pointer">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(profile.id)}
            >
              Copy profile ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View profile details</DropdownMenuItem>
            <DropdownMenuItem>Edit profile</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
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
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by ICAO code..."
          value={(table.getColumn("icaoCode")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("icaoCode")?.setFilterValue(event.target.value)
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
                  data-state={row.getIsSelected() && "selected"}
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
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} profile(s) selected.
        </div>
        <div className="space-x-2">
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