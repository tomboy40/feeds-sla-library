"use client";

import { useState, useCallback } from "react";
import { Search, Database, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InterfaceTable from "@/components/interface-table";
import { Interface } from "@/types/interfaces";
import { DebugPanel } from "@/components/debug-panel";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const appIdMatch = searchQuery.match(/^[0-9]{3,8}$/);
      if (appIdMatch) {
        setSelectedAppId(searchQuery);
      } else {
        setSelectedAppId(null);
        setInterfaces([]);
      }
    }
  }, [searchQuery]);

  const handleInterfacesUpdate = useCallback((newInterfaces: Interface[]) => {
    console.log('Updating interfaces in parent:', newInterfaces);
    setInterfaces(newInterfaces);
    setIsLoading(false);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleError = useCallback((err: string | null) => {
    setError(err);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <Database className="h-6 w-6 mr-2" />
          <h1 className="text-xl font-semibold">SLA Library</h1>
        </div>
      </div>

      <main className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by application ID (e.g., 12345678)..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={8}
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={!selectedAppId || interfaces.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        <InterfaceTable 
          searchQuery={searchQuery}
          selectedAppId={selectedAppId}
          onInterfacesUpdate={handleInterfacesUpdate}
          onLoadingChange={handleLoadingChange}
          onError={handleError}
        />

        <DebugPanel
          selectedAppId={selectedAppId}
          interfaces={interfaces}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}