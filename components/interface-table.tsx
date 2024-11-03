"use client";

import { useState } from "react";
import { Interface } from "@/types/interfaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface InterfaceTableProps {
  searchQuery: string;
  selectedAppId: string | null;
}

export default function InterfaceTable({ searchQuery, selectedAppId }: InterfaceTableProps) {
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInterfaces = async (forceRefresh: boolean = false) => {
    if (!selectedAppId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/interfaces?appId=${selectedAppId}&forceRefresh=${forceRefresh}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch interfaces');
      }

      const data = await response.json();
      setInterfaces(data);
      
      toast({
        title: "Success",
        description: forceRefresh 
          ? "Interfaces refreshed from DLAS"
          : "Interfaces loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load interfaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInterfaces = interfaces.filter((iface) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      iface.senderAppId.toLowerCase().includes(searchLower) ||
      iface.senderAppName.toLowerCase().includes(searchLower) ||
      iface.receiverAppId.toLowerCase().includes(searchLower) ||
      iface.receiverAppName.toLowerCase().includes(searchLower)
    );
  });

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      {selectedAppId && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 inline-block mr-2" />
            Showing active interfaces. Demised interfaces are hidden.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInterfaces(true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh from DLAS
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Interface ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInterfaces.map((iface) => (
              <TableRow key={iface.id}>
                <TableCell className="font-medium">{iface.id}</TableCell>
                <TableCell>{iface.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{iface.senderAppId}</span>
                    <span className="text-sm text-muted-foreground">
                      {iface.senderAppName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{iface.receiverAppId}</span>
                    <span className="text-sm text-muted-foreground">
                      {iface.receiverAppName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{iface.transferType}</TableCell>
                <TableCell>{iface.frequency}</TableCell>
                <TableCell>{iface.sla}</TableCell>
                <TableCell>
                  <Badge variant={getImpactColor(iface.impact)}>
                    {iface.impact}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Interface</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="sla" className="text-right">
                            SLA
                          </Label>
                          <Input
                            id="sla"
                            defaultValue={iface.sla}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="impact" className="text-right">
                            Impact
                          </Label>
                          <Select defaultValue={iface.impact.toLowerCase()}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select impact level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit">Save changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}