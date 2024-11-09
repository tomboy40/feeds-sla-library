"use client";

import { useState, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Interface } from "@/types/interfaces";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface InterfaceTableProps {
  searchQuery: string;
  selectedAppId: string | null;
  onInterfacesUpdate?: (interfaces: Interface[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string | null) => void;
}

export default function InterfaceTable({ 
  searchQuery, 
  selectedAppId,
  onInterfacesUpdate,
  onLoadingChange,
  onError
}: InterfaceTableProps) {
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState<string | null>(null);
  const [editingInterface, setEditingInterface] = useState<Interface | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ completed: number; total: number } | null>(null);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoadingChange?.(loading);
  }, [onLoadingChange]);

  const setErrorState = useCallback((error: string | null) => {
    onError?.(error);
  }, [onError]);

  const updateInterfaces = useCallback((newInterfaces: Interface[]) => {
    console.log('Setting interfaces in table:', newInterfaces);
    setInterfaces(newInterfaces);
    onInterfacesUpdate?.(newInterfaces);
  }, [onInterfacesUpdate]);

  const fetchInterfaces = useCallback(async () => {
    if (!selectedAppId || hasFetched === selectedAppId) return;
    
    setLoadingState(true);
    setErrorState(null);
    try {
      console.log('Fetching interfaces for app:', selectedAppId);
      const response = await fetch(`/api/interfaces?appId=${selectedAppId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch interfaces');
      }
      
      console.log('Received data in component:', data);
      
      if (Array.isArray(data)) {
        console.log('Setting interfaces:', data);
        updateInterfaces(data);
        setHasFetched(selectedAppId);
        toast({
          title: "Success",
          description: data.length > 0 ? `Found ${data.length} interface(s)` : "No interfaces found",
        });
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      updateInterfaces([]);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interfaces';
      setErrorState(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingState(false);
    }
  }, [selectedAppId, hasFetched, updateInterfaces, setLoadingState, setErrorState]);

  // Update effect to prevent infinite loop
  useEffect(() => {
    if (selectedAppId && hasFetched !== selectedAppId) {
      fetchInterfaces();
    }
  }, [selectedAppId, hasFetched, fetchInterfaces]);

  // Reset hasFetched when selectedAppId changes
  useEffect(() => {
    if (!selectedAppId) {
      setHasFetched(null);
      setInterfaces([]);
    }
  }, [selectedAppId]);

  const handleEdit = async (sla: string) => {
    if (!editingInterface) return;

    try {
      const response = await fetch(`/api/interfaces/${editingInterface.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sla }),
      });

      if (!response.ok) {
        throw new Error('Failed to update interface');
      }

      const result = await response.json();

      // Update the local state with the edited interface
      setInterfaces(prevInterfaces => 
        prevInterfaces.map(iface => 
          iface.id === editingInterface.id 
            ? { ...iface, sla, updatedAt: new Date() }
            : iface
        )
      );

      setEditDialogOpen(false);
      setEditingInterface(null);

      toast({
        title: "Success",
        description: "Interface updated successfully",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update interface",
        variant: "destructive",
      });
    }
  };

  // Filter interfaces based on search query
  const filteredInterfaces = interfaces.filter(iface => {
    if (selectedAppId) {
      return true;
    }
    
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      iface.id.toLowerCase().includes(searchLower) ||
      iface.interfaceName.toLowerCase().includes(searchLower) ||
      iface.sendAppName.toLowerCase().includes(searchLower) ||
      iface.receivedAppName.toLowerCase().includes(searchLower) ||
      iface.transferType.toLowerCase().includes(searchLower) ||
      iface.frequency.toLowerCase().includes(searchLower)
    );
  });

  // Edit Dialog Component
  const EditDialog = () => {
    const [sla, setSla] = useState(editingInterface?.sla || '');
    const [priority, setPriority] = useState<Interface['priority']>(editingInterface?.priority || 'Medium');
    const [remarks, setRemarks] = useState(editingInterface?.remarks || '');

    const handleClose = () => {
      setEditDialogOpen(false);
      setEditingInterface(null);
    };

    const handleSave = async () => {
      if (!editingInterface) return;
      
      try {
        const response = await fetch(`/api/interfaces/${editingInterface.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sla, 
            priority, 
            remarks 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update interface');
        }

        const result = await response.json();

        setInterfaces(prevInterfaces => 
          prevInterfaces.map(iface => 
            iface.id === editingInterface.id 
              ? { ...iface, sla, priority, remarks, updatedAt: new Date() }
              : iface
          )
        );

        setEditDialogOpen(false);
        setEditingInterface(null);

        toast({
          title: "Success",
          description: "Interface updated successfully",
        });
      } catch (error) {
        console.error('Update error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update interface",
          variant: "destructive",
        });
      }
    };

    return (
      <DialogContent onInteractOutside={handleClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Interface Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="interfaceName" className="text-right">Interface Name</label>
            <div className="col-span-3 font-medium">{editingInterface?.interfaceName}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="sla" className="text-right">SLA</label>
            <Input
              id="sla"
              value={sla}
              onChange={(e) => setSla(e.target.value)}
              className="col-span-3"
              placeholder="Enter SLA target..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="priority" className="text-right">Priority</label>
            <Select
              value={priority}
              onValueChange={(value: Interface['priority']) => setPriority(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <label htmlFor="remarks" className="text-right pt-2">Remarks</label>
            <Textarea
              id="remarks"
              value={remarks || ''}
              onChange={(e) => setRemarks(e.target.value)}
              className="col-span-3"
              placeholder="Enter interface remarks..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  const handleSyncWithDLAS = async () => {
    if (!selectedAppId) return;
    
    setIsSyncing(true);
    setLoadingProgress(null);
    setErrorState(null);
    try {
      const response = await fetch(
        `/api/interfaces?appId=${selectedAppId}&forceRefresh=true`, 
        {
          headers: {
            'Accept': 'text/event-stream',
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync with DLAS');
      }
      
      const data = await response.json();
      updateInterfaces(data);
      
      toast({
        title: "Success",
        description: `Successfully synchronized ${data.length} interfaces with DLAS`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      const message = error instanceof Error ? error.message : 'Failed to sync with DLAS';
      setErrorState(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setLoadingProgress(null);
    }
  };

  // Loading message component with progress
  const LoadingMessage = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <div className="flex items-center mb-4">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>
      {loadingProgress && (
        <div className="w-full max-w-xs space-y-2">
          <Progress value={(loadingProgress.completed / loadingProgress.total) * 100} />
          <p className="text-xs text-center">
            Loading interfaces: {loadingProgress.completed} of {loadingProgress.total}
          </p>
        </div>
      )}
    </div>
  );

  // Render the table with sync button
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {selectedAppId 
            ? `Interfaces for App ID: ${selectedAppId}`
            : 'Interface List'}
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncWithDLAS}
            disabled={!selectedAppId || isSyncing}
            variant="default"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Retrieving...' : 'Retrieve Latest from DLAS'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Interface ID</TableHead>
              <TableHead>Interface Name</TableHead>
              <TableHead>Send App ID</TableHead>
              <TableHead>Send App Name</TableHead>
              <TableHead>Receive App Name</TableHead>
              <TableHead>Transfer Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Technology</TableHead>
              <TableHead>Interface Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={14}>
                  <LoadingMessage message="Loading interfaces..." />
                </TableCell>
              </TableRow>
            ) : isSyncing ? (
              <TableRow>
                <TableCell colSpan={14}>
                  <LoadingMessage message="Retrieving latest interfaces from DLAS..." />
                </TableCell>
              </TableRow>
            ) : interfaces.length > 0 ? (
              filteredInterfaces.map((iface) => (
                <TableRow key={iface.id}>
                  <TableCell className="font-mono text-sm">{iface.eimInterfaceId || '-'}</TableCell>
                  <TableCell>{iface.interfaceName}</TableCell>
                  <TableCell className="font-mono text-sm">{iface.sendAppId}</TableCell>
                  <TableCell>{iface.sendAppName}</TableCell>
                  <TableCell>{iface.receivedAppName}</TableCell>
                  <TableCell>{iface.transferType}</TableCell>
                  <TableCell>{iface.frequency}</TableCell>
                  <TableCell>{iface.pattern || '-'}</TableCell>
                  <TableCell>{iface.technology || '-'}</TableCell>
                  <TableCell>
                    {iface.interfaceStatus === 'active' ? (
                      <div className="flex items-center text-green-600" title="Active">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400" title="Inactive">
                        <XCircle className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      iface.priority === 'High' ? 'destructive' : 
                      iface.priority === 'Medium' ? 'default' : 'secondary'
                    }>
                      {iface.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{iface.sla}</TableCell>
                  <TableCell>{iface.remarks || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingInterface(iface);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={14}>
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p>No interfaces found</p>
                    {selectedAppId && (
                      <p className="text-sm mt-2">
                        Click &apos;Retrieve Latest from DLAS&apos; to fetch interfaces
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          {editingInterface && <EditDialog />}
        </Dialog>
      </div>
    </div>
  );
}