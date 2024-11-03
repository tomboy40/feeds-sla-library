"use client";

import { useState, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Interface } from "@/types/interfaces";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

  const handleEdit = async (sla: string, impact: Interface['impact']) => {
    if (!editingInterface) return;

    try {
      const response = await fetch(`/api/interfaces/${editingInterface.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sla, impact }),
      });

      if (!response.ok) {
        throw new Error('Failed to update interface');
      }

      const result = await response.json();

      // Update the local state with the edited interface
      setInterfaces(prevInterfaces => 
        prevInterfaces.map(iface => 
          iface.id === editingInterface.id 
            ? { ...iface, sla, impact, updatedAt: new Date() }
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
      iface.name.toLowerCase().includes(searchLower) ||
      iface.senderAppName.toLowerCase().includes(searchLower) ||
      iface.receiverAppName.toLowerCase().includes(searchLower) ||
      iface.transferType.toLowerCase().includes(searchLower) ||
      iface.frequency.toLowerCase().includes(searchLower)
    );
  });

  // Edit Dialog Component
  const EditDialog = () => {
    const [sla, setSla] = useState(editingInterface?.sla || '');
    const [impact, setImpact] = useState<Interface['impact']>(editingInterface?.impact || 'Medium');

    const handleClose = () => {
      setEditDialogOpen(false);
      setEditingInterface(null);
    };

    return (
      <DialogContent onInteractOutside={handleClose}>
        <DialogHeader>
          <DialogTitle>Edit Interface {editingInterface?.id}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="sla">SLA</label>
            <Input
              id="sla"
              value={sla}
              onChange={(e) => setSla(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="impact">Impact</label>
            <Select
              value={impact}
              onValueChange={(value: Interface['impact']) => setImpact(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select impact level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={() => handleEdit(sla, impact)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    );
  };

  const handleSyncWithDLAS = async () => {
    if (!selectedAppId) return;
    
    setIsSyncing(true);
    setErrorState(null);
    try {
      const response = await fetch(`/api/interfaces?appId=${selectedAppId}&forceRefresh=true`);
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
    }
  };

  // Loading message component
  const LoadingMessage = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      <span>{message}</span>
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
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Transfer Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Product Type</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <LoadingMessage message="Loading interfaces..." />
                </TableCell>
              </TableRow>
            ) : isSyncing ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <LoadingMessage message="Retrieving latest interfaces from DLAS..." />
                </TableCell>
              </TableRow>
            ) : interfaces.length > 0 ? (
              filteredInterfaces.map((iface) => (
                <TableRow key={iface.id}>
                  <TableCell className="font-mono text-sm">{iface.id}</TableCell>
                  <TableCell>{iface.name}</TableCell>
                  <TableCell>{iface.senderAppName}</TableCell>
                  <TableCell>{iface.receiverAppName}</TableCell>
                  <TableCell>{iface.transferType}</TableCell>
                  <TableCell>{iface.frequency}</TableCell>
                  <TableCell>{iface.productType}</TableCell>
                  <TableCell>{iface.entity}</TableCell>
                  <TableCell>{iface.sla}</TableCell>
                  <TableCell>
                    <Badge variant={iface.impact === 'High' ? 'destructive' : 'secondary'}>
                      {iface.impact}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={iface.status === 'active' ? 'default' : 'secondary'}>
                      {iface.status}
                    </Badge>
                  </TableCell>
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
                <TableCell colSpan={12}>
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