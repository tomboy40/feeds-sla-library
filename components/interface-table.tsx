"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { MouseEvent, FormEvent } from "react";
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
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Interface } from "@/types/interfaces";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  FilterX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface InterfaceTableProps {
  searchQuery: string;
  selectedAppId: string | null;
  onInterfacesUpdate?: (interfaces: Interface[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string | null) => void;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface TableState {
  page: number;
  pageSize: number;
  sort?: SortConfig;
  total: number;
}

interface ColumnFilter {
  [key: string]: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'checkbox';
  filterOptions?: { value: string; label: string }[];
}

// Define page size options with proper typing
const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
  { value: '100', label: '100' }
] as const;

const COLUMNS: ColumnConfig[] = [
  { key: 'eimInterfaceId', label: 'Interface ID', sortable: true, filterable: true },
  { key: 'interfaceName', label: 'Interface Name', sortable: true, filterable: true },
  { key: 'sendAppId', label: 'Send App ID', sortable: true, filterable: true },
  { key: 'sendAppName', label: 'Send App Name', sortable: true, filterable: true },
  { key: 'receivedAppId', label: 'Receive App ID', sortable: true, filterable: true },
  { key: 'receivedAppName', label: 'Receive App Name', sortable: true, filterable: true },
  { key: 'transferType', label: 'Transfer Type', sortable: true, filterable: true },
  { key: 'frequency', label: 'Frequency', sortable: true, filterable: true },
  { key: 'pattern', label: 'Pattern', sortable: true, filterable: true },
  { key: 'technology', label: 'Technology', sortable: true, filterable: true },
  { 
    key: 'interfaceStatus', 
    label: 'Interface Status', 
    sortable: true,
    filterable: true,
    filterType: 'checkbox',
    filterOptions: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  { 
    key: 'priority', 
    label: 'Priority',
    sortable: true,
    filterable: true,
    filterType: 'checkbox',
    filterOptions: [
      { value: 'High', label: 'High' },
      { value: 'Medium', label: 'Medium' },
      { value: 'Low', label: 'Low' }
    ]
  },
  { key: 'sla', label: 'SLA', sortable: true, filterable: true },
  { key: 'remarks', label: 'Remarks', sortable: false, filterable: false }
];

// Add debug panel component
const DebugPanel = ({ table }: { table: any }) => {
  return (
    <div className="bg-muted/50 p-4 rounded-lg text-sm">
      <h3 className="font-semibold mb-2">Debug Info:</h3>
      <div className="space-y-1">
        <div>Active Filters: {table.getState().columnFilters.length}</div>
        <div>Active Sort: {table.getState().sorting.length ? `${table.getState().sorting[0].id} (${table.getState().sorting[0].desc ? 'desc' : 'asc'})` : 'none'}</div>
        <div>Total Rows: {table.getPreFilteredRowModel().rows.length}</div>
        <div>Filtered Rows: {table.getFilteredRowModel().rows.length}</div>
        <div>Current Page: {table.getState().pagination.pageIndex + 1}</div>
        <pre className="text-xs mt-2 bg-muted p-2 rounded">
          {JSON.stringify(table.getState(), null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Update the ColumnFilterButton component to handle external filter clearing
const ColumnFilterButton = ({ column, columnConfig }: { 
  column: any; 
  columnConfig: (typeof COLUMNS)[number];
}) => {
  const [pendingTextFilter, setPendingTextFilter] = useState(column.getFilterValue() as string || '');
  const [pendingCheckboxSelections, setPendingCheckboxSelections] = useState<string[]>(
    (column.getFilterValue() as string[]) || []
  );
  const [isOpen, setIsOpen] = useState(false);

  // Reset pending filters when column filter value changes
  useEffect(() => {
    if (!column.getFilterValue()) {
      setPendingCheckboxSelections([]);
      setPendingTextFilter('');
    }
  }, [column.getFilterValue()]);

  if (!columnConfig?.filterable) {
    return null;
  }

  const hasFilter = column.getFilterValue() != null;

  const areAllOptionsSelected = () => {
    if (columnConfig.filterType !== 'checkbox' || !columnConfig.filterOptions) {
      return false;
    }
    const currentValue = column.getFilterValue() as string[] || [];
    return currentValue.length === columnConfig.filterOptions.length;
  };

  const showActiveFilter = hasFilter && !areAllOptionsSelected();

  const handleFilterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (columnConfig.filterType === 'checkbox') {
      column.setFilterValue(pendingCheckboxSelections.length ? pendingCheckboxSelections : undefined);
    } else {
      column.setFilterValue(pendingTextFilter || undefined);
    }
  };

  const handleClearFilter = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    column.setFilterValue(undefined);
    setPendingCheckboxSelections([]);
    setPendingTextFilter('');
  };

  return (
    <DropdownMenu 
      modal={false}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${
            showActiveFilter 
              ? 'opacity-100' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {showActiveFilter ? (
            <FilterX className="h-4 w-4" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-48 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleFilterSubmit} className="space-y-2">
          {columnConfig.filterType === 'checkbox' ? (
            <>
              <div className="space-y-2">
                {columnConfig.filterOptions?.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${column.id}-${option.value}`}
                      checked={pendingCheckboxSelections.includes(option.value)}
                      onCheckedChange={(checked) => {
                        setPendingCheckboxSelections(prev => {
                          if (checked) {
                            return [...prev, option.value];
                          }
                          return prev.filter(v => v !== option.value);
                        });
                      }}
                    />
                    <label htmlFor={`${column.id}-${option.value}`}>{option.label}</label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilter}
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  variant="secondary"
                >
                  Apply
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                placeholder={`Filter ${columnConfig.label}...`}
                value={pendingTextFilter}
                onChange={(e) => setPendingTextFilter(e.target.value)}
                className="h-8"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilter}
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  variant="secondary"
                >
                  Apply
                </Button>
              </div>
            </>
          )}
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Add interface for API parameters
interface FetchParams {
  appId: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Add interface for edit form state
interface EditFormState {
  sla: string;
  priority: 'High' | 'Medium' | 'Low';
  remarks: string;
}

export default function InterfaceTable({ 
  searchQuery, 
  selectedAppId,
  onInterfacesUpdate,
  onLoadingChange,
  onError
}: InterfaceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<Record<string, string>>({});

  // Add debug state
  const [showDebug, setShowDebug] = useState(false);

  // Add state for edit dialog
  const [editingInterface, setEditingInterface] = useState<Interface | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editFormState, setEditFormState] = useState<EditFormState | null>(null);

  const setErrorState = useCallback((error: string | null) => {
    onError?.(error);
  }, [onError]);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoadingChange?.(loading);
  }, [onLoadingChange]);

  const handleSyncWithDLAS = useCallback(async () => {
    if (!selectedAppId) return;
    
    setIsSyncing(true);
    setErrorState(null);
    try {
      const response = await fetch(
        `/api/interfaces?appId=${selectedAppId}&forceRefresh=true`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync with DLAS');
      }
      
      const data = await response.json();
      if (!data.interfaces || data.interfaces.length === 0) {
        toast({
          title: "No Data Found",
          description: "No interfaces found in DLAS for this application ID.",
          variant: "default"
        });
        return;
      }

      setInterfaces(data.interfaces);
      onInterfacesUpdate?.(data.interfaces);
      
      toast({
        title: "Success",
        description: `Successfully retrieved ${data.interfaces.length} interfaces from DLAS`,
      });
    } catch (error) {
      console.error('DLAS Sync Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to sync with DLAS';
      setErrorState(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [selectedAppId, onInterfacesUpdate, setErrorState]);

  // Update fetchInterfaces to handle sorting and filtering
  const fetchInterfaces = useCallback(async (params: FetchParams) => {
    if (!params.appId) return;
    
    setLoadingState(true);
    setErrorState(null);
    
    try {
      // Convert params to URLSearchParams
      const queryParams = new URLSearchParams({
        appId: params.appId,
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortDirection && { sortDirection: params.sortDirection }),
        ...(params.filters && { filters: JSON.stringify(params.filters) })
      });

      const response = await fetch(`/api/interfaces?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch interfaces');
      }
      
      const data = await response.json();
      setInterfaces(data.interfaces);
      onInterfacesUpdate?.(data.interfaces);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch interfaces';
      setErrorState(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingState(false);
    }
  }, [setLoadingState, setErrorState, onInterfacesUpdate]);

  // Update handleEdit function
  const handleEdit = useCallback(async (interface_: Interface) => {
    try {
      setEditingInterface(interface_);
      setEditFormState({
        sla: interface_.sla || '',
        priority: interface_.priority as 'High' | 'Medium' | 'Low',
        remarks: interface_.remarks || ''
      });
      setIsEditSheetOpen(true);
    } catch (error) {
      console.error('Error handling edit:', error);
      toast({
        title: "Error",
        description: "Failed to open edit dialog",
        variant: "destructive",
      });
    }
  }, []);

  // Move columns definition first
  const columns = useMemo<ColumnDef<Interface>[]>(
    () => [
      ...COLUMNS.map((col): ColumnDef<Interface> => ({
        accessorKey: col.key,
        enableSorting: col.sortable,
        header: ({ column }) => {
          const columnConfig = COLUMNS.find(c => c.key === column.id);
          if (!columnConfig) return null;

          return (
            <div className="flex items-center justify-between group">
              <Button
                variant="ghost"
                onClick={() => col.sortable ? column.toggleSorting(column.getIsSorted() === "asc") : undefined}
                className="hover:bg-transparent p-0 font-semibold"
              >
                {columnConfig.label}
                {col.sortable && column.getIsSorted() && (
                  column.getIsSorted() === "asc" ? 
                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                    <ArrowDown className="ml-2 h-4 w-4" />
                )}
              </Button>
              {columnConfig.filterable && (
                <div className="relative">
                  <ColumnFilterButton column={column} columnConfig={columnConfig} />
                </div>
              )}
            </div>
          );
        },
        cell: ({ row }) => {
          const value = row.getValue(col.key);
          
          if (col.key === 'interfaceStatus') {
            return (
              <Badge variant={value === 'active' ? "default" : "secondary"}>
                {value === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            );
          }
          
          if (col.key === 'priority') {
            const priorityValue = value as string;
            return (
              <Badge variant={
                priorityValue === "High" ? "destructive" :
                priorityValue === "Medium" ? "default" : "secondary"
              }>
                {priorityValue}
              </Badge>
            );
          }
          
          return <span>{String(value ?? '')}</span>;
        },
        filterFn: (row, id, value) => {
          if (Array.isArray(value)) {
            return value.includes(row.getValue(id));
          }
          const cellValue = row.getValue(id);
          return cellValue != null 
            ? String(cellValue).toLowerCase().includes((value as string).toLowerCase())
            : false;
        },
      })),
      {
        id: 'actions',
        enableSorting: false,
        enableFiltering: false,
        size: 50,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row.original);
              }}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit]
  );

  // Then table initialization
  const table = useReactTable({
    data: interfaces,
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      
      // Fetch data with new sorting
      if (selectedAppId) {
        const sortColumn = newSorting[0];
        fetchInterfaces({
          appId: selectedAppId,
          page: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          sortBy: sortColumn?.id,
          sortDirection: sortColumn?.desc ? 'desc' : 'asc',
          filters: table.getState().columnFilters.reduce((acc, filter) => ({
            ...acc,
            [filter.id]: filter.value
          }), {})
        });
      }
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);
      
      // Fetch data with new filters
      if (selectedAppId) {
        const sortColumn = table.getState().sorting[0];
        fetchInterfaces({
          appId: selectedAppId,
          page: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          sortBy: sortColumn?.id,
          sortDirection: sortColumn?.desc ? 'desc' : 'asc',
          filters: newFilters.reduce((acc, filter) => ({
            ...acc,
            [filter.id]: filter.value
          }), {})
        });
      }
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' 
        ? updater(table.getState().pagination)
        : updater;
      
      // Fetch data with new pagination
      if (selectedAppId) {
        const sortColumn = table.getState().sorting[0];
        fetchInterfaces({
          appId: selectedAppId,
          page: newPagination.pageIndex + 1,
          pageSize: newPagination.pageSize,
          sortBy: sortColumn?.id,
          sortDirection: sortColumn?.desc ? 'desc' : 'asc',
          filters: table.getState().columnFilters.reduce((acc, filter) => ({
            ...acc,
            [filter.id]: filter.value
          }), {})
        });
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Then move handleEditSubmit after table initialization
  const handleEditSubmit = useCallback(async () => {
    if (!editingInterface || !editFormState) return;

    try {
      const response = await fetch(`/api/interfaces/${editingInterface.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sla: editFormState.sla,
          priority: editFormState.priority,
          remarks: editFormState.remarks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update interface');
      }
      
      // Close the sheet and clear the editing state
      setIsEditSheetOpen(false);
      setEditingInterface(null);
      setEditFormState(null);
      
      toast({
        title: "Success",
        description: "Interface updated successfully",
      });
      
      // Refresh the table data
      if (selectedAppId) {
        fetchInterfaces({
          appId: selectedAppId,
          page: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
        });
      }
    } catch (error) {
      console.error('Error updating interface:', error);
      toast({
        title: "Error",
        description: "Failed to update interface",
        variant: "destructive",
      });
    }
  }, [editingInterface, editFormState, selectedAppId, table, fetchInterfaces]);

  // Update initial data fetch
  useEffect(() => {
    if (selectedAppId) {
      fetchInterfaces({
        appId: selectedAppId,
        page: 1,
        pageSize: table.getState().pagination.pageSize
      });
    } else {
      setInterfaces([]);
    }
  }, [selectedAppId, table.getState().pagination.pageSize, fetchInterfaces]);

  const hasActiveFilters = useMemo(() => {
    return columnFilters.length > 0;
  }, [columnFilters]);

  // Update the handleClearAllFilters function
  const handleClearAllFilters = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Reset all table state
      table.resetColumnFilters();
      table.resetSorting();
      table.setPageIndex(0);
      table.setPageSize(10);

      // Reset internal state
      setColumnFilters([]);
      setSorting([]);

      // Fetch fresh data with cleared filters
      if (selectedAppId) {
        const response = await fetch(
          `/api/interfaces?appId=${selectedAppId}&page=1&pageSize=10`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data after clearing filters');
        }

        const data = await response.json();
        setInterfaces(data.interfaces);
        onInterfacesUpdate?.(data.interfaces);
      }

      // Close any open filter dropdowns
      const dropdownTriggers = document.querySelectorAll('[data-state="open"]');
      dropdownTriggers.forEach((trigger) => {
        const closeEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        trigger.dispatchEvent(closeEvent);
      });

      toast({
        title: "Filters Cleared",
        description: "All filters have been reset",
      });

    } catch (error) {
      console.error('Error clearing filters:', error);
      toast({
        title: "Error",
        description: "Failed to clear filters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [table, selectedAppId, onInterfacesUpdate]);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = parseInt(newSize, 10);
    table.setPageSize(size);
    // Fetch data with new page size
    if (selectedAppId) {
      fetchInterfaces({
        appId: selectedAppId,
        page: 1, // Reset to first page when changing page size
        pageSize: size,
        sortBy: table.getState().sorting[0]?.id,
        sortDirection: table.getState().sorting[0]?.desc ? 'desc' : 'asc',
        filters: table.getState().columnFilters.reduce((acc, filter) => ({
          ...acc,
          [filter.id]: filter.value
        }), {})
      });
    }
  }, [table, fetchInterfaces, selectedAppId]);

  const HeaderGroup = useCallback(({ headerGroup }: { headerGroup: any }) => (
    <TableRow key={headerGroup.id}>
      {headerGroup.headers.map((header: any) => (
        <TableHead key={header.id} className="whitespace-nowrap">
          {header.isPlaceholder
            ? null
            : flexRender(
                header.column.columnDef.header,
                header.getContext()
              )}
        </TableHead>
      ))}
    </TableRow>
  ), []);

  // Update the useEffect hook that handles table state changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedAppId) return;
      
      setIsLoading(true);
      try {
        const filters = columnFilters.reduce((acc, filter) => ({
          ...acc,
          [filter.id]: filter.value
        }), {});

        // Create base params object
        const params: Record<string, string> = {
          appId: selectedAppId,
          page: (table.getState().pagination.pageIndex + 1).toString(),
          pageSize: table.getState().pagination.pageSize.toString(),
        };

        // Add sorting if present
        if (sorting.length > 0) {
          params.sortBy = sorting[0].id;
          params.sortDirection = sorting[0].desc ? 'desc' : 'asc';
        }

        // Add filters if present
        if (Object.keys(filters).length > 0) {
          params.filters = JSON.stringify(filters);
        }

        const queryParams = new URLSearchParams(params);
        const response = await fetch(`/api/interfaces?${queryParams}`);
        
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        setInterfaces(data.interfaces);
        onInterfacesUpdate?.(data.interfaces);
      } catch (error) {
        console.error('Error fetching data:', error);
        onError?.(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchData, 300);
    return () => clearTimeout(timeoutId);
  }, [
    selectedAppId,
    columnFilters,
    sorting,
    table.getState().pagination.pageIndex,
    table.getState().pagination.pageSize,
    onInterfacesUpdate,
    onError
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Interfaces</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-8 px-2 lg:px-3"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
        <Button
          onClick={handleSyncWithDLAS}
          disabled={!selectedAppId || isSyncing}
          variant="default"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Retrieving..." : "Retrieve Latest from DLAS"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <HeaderGroup key={headerGroup.id} headerGroup={headerGroup} />
            ))}
          </TableHeader>
          <TableBody>
            {isLoading || isSyncing ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isSyncing ? "Retrieving latest interfaces..." : "Loading..."}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/50"
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
                  {selectedAppId ? (
                    <div className="flex flex-col items-center gap-2">
                      <p>No interfaces found for this application</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncWithDLAS}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        Retrieve from DLAS
                      </Button>
                    </div>
                  ) : (
                    <p>Please enter an application ID to search</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </p>
          <div className="flex items-center space-x-2">
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add debug toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Edit Interface</SheetTitle>
            <SheetDescription>
              Update the SLA, priority, and remarks for this interface.
            </SheetDescription>
          </SheetHeader>
          
          {editingInterface && editFormState && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                {/* Read-only information */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Interface Details</h3>
                  <div className="text-sm text-muted-foreground">
                    <p><span className="font-medium">ID:</span> {editingInterface.eimInterfaceId}</p>
                    <p><span className="font-medium">Name:</span> {editingInterface.interfaceName}</p>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SLA</label>
                    <Input
                      value={editFormState.sla}
                      onChange={(e) => setEditFormState(prev => prev ? { ...prev, sla: e.target.value } : null)}
                      placeholder="Enter SLA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={editFormState.priority}
                      onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                        setEditFormState(prev => prev ? { ...prev, priority: value } : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Remarks</label>
                    <Textarea
                      value={editFormState.remarks}
                      onChange={(e) => setEditFormState(prev => prev ? { ...prev, remarks: e.target.value } : null)}
                      placeholder="Enter remarks"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <SheetClose asChild>
                  <Button variant="outline" onClick={() => {
                    setEditFormState(null);
                    setEditingInterface(null);
                  }}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button 
                  onClick={handleEditSubmit}
                  disabled={!editFormState}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {showDebug && <DebugPanel table={table} />}
    </div>
  );
}