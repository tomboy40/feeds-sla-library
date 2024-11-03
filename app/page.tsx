"use client";

import { useState } from "react";
import { Search, Download, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InterfaceTable from "@/components/interface-table";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Extract application ID if it matches the format (e.g., "APP001")
    const appIdMatch = value.match(/^[A-Z]{3}\d{3}$/);
    setSelectedAppId(appIdMatch ? value : null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <Database className="h-6 w-6 mr-2" />
          <h1 className="text-xl font-semibold">SLA Library</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto py-6 space-y-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by application ID (e.g., CRM001)..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        {/* Interface Table */}
        <InterfaceTable 
          searchQuery={searchQuery}
          selectedAppId={selectedAppId}
        />
      </main>
    </div>
  );
}