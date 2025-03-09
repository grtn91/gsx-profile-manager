import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import { getRelativePath } from "@/lib/utils"
import { dirname } from "@tauri-apps/api/path"
import { open } from "@tauri-apps/plugin-shell";
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ProfileUploader from "@/features/profile-uploader/components/profile-uploader"
import { getFstoLinkById } from "@/lib/db"

export function GsxProfilesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [profileToEdit, setProfileToEdit] = useState<GSXProfile | null>(null);

  const { profiles, initializeStore } = useProfileStore();

  // Track which ICAO codes are currently synced/selected
  const syncedIcaoCodes = React.useMemo(() => {
    if (!profiles) return new Map<string, string>();

    const syncedCodes = new Map<string, string>(); // Maps ICAO code to profile ID

    profiles.forEach(profile => {
      if (profile.status && profile.airportIcaoCode) {
        syncedCodes.set(profile.airportIcaoCode, profile.id);
      }
    });

    return syncedCodes;
  }, [profiles]);

  const columns: ColumnDef<GSXProfile>[] = [
    {
      id: "sync",
      header: "Sync",
      cell: ({ row }) => {
        const profile = row.original;
        const { syncProfile, unsyncProfile } = useProfileStore();

        // Check if another profile with same ICAO code is already synced
        const isConflicting = Boolean(
          profile.airportIcaoCode &&
          syncedIcaoCodes.has(profile.airportIcaoCode) &&
          syncedIcaoCodes.get(profile.airportIcaoCode) !== profile.id
        );

        // Handle toggling sync status
        const handleToggleSync = async (checked: boolean) => {
          try {
            if (checked) {
              await syncProfile(profile.id);
              toast.success(`${profile.airportIcaoCode} selected to be linked`);
            } else {
              await unsyncProfile(profile.id);
              toast.success(`${profile.airportIcaoCode} unselected`);
            }
          } catch (error) {
            toast.error(`Failed to update profile status: ${error instanceof Error ? error.message : String(error)}`);
          }
        };

        return (
          <Checkbox
            checked={profile.status}
            onCheckedChange={handleToggleSync}
            disabled={isConflicting}
            aria-label="Toggle sync status"
          />
        );
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

        const handleUpdate = () => {
          setProfileToEdit(profile);
        }

        const handleVisit = async () => {
          try {
            const link = await getFstoLinkById(profile.id);
            console.log(link);
            // Open the FSTO link in a new tab
            if (link) {
              open(link);
            } else {
              toast.error("FSTO link not found");
            }
            return link;
          } catch (error) {
            toast.error(`Failed to get FSTO link: ${error instanceof Error ? error.message : String(error)}`);
            return null;
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
              <DropdownMenuItem onClick={handleUpdate}>
                Update profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleVisit}>
                Visit FSTO link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                Delete profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }
  ]

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
    <div className="min-w-fit">
      <div className="flex items-center py-4"><>
        {/* Edit Profile Dialog */}
        <Dialog open={profileToEdit !== null} onOpenChange={(open) => !open && setProfileToEdit(null)}>
          <DialogContent className="sm:max-w-[fit-content] md:max-w-[fit]"> {/* Increased width to match Header dialog */}
            <DialogHeader className="hidden">
              <DialogTitle className="text-xl font-bold">Update GSX Profile</DialogTitle>
              <DialogDescription>
                Edit profile details or manage attached files
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4"> {/* Added spacing for consistency */}
              {profileToEdit && (
                <ProfileUploader
                  existingProfile={profileToEdit}
                  onSuccess={() => {
                    setProfileToEdit(null);
                    toast.success(`Profile for ${profileToEdit.airportIcaoCode} updated successfully`);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
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
              table.getRowModel().rows.map((row) => {
                // Check if this row has a conflicting ICAO code
                const profile = row.original;
                const isConflicting = Boolean(
                  profile.airportIcaoCode &&
                  syncedIcaoCodes.has(profile.airportIcaoCode) &&
                  syncedIcaoCodes.get(profile.airportIcaoCode) !== profile.id
                );

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.original.status ? "selected" : undefined}
                    style={isConflicting ? { backgroundColor: 'rgba(254, 202, 202, 0.5)' } : undefined}
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
                );
              })
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
          {syncedCount} of {profiles?.length || 0} profile(s) selected for linking.
        </div>
      </div>
    </div>
  )
}