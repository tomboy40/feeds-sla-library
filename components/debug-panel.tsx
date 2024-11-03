"use client";

import { Interface } from "@/types/interfaces";

interface DebugPanelProps {
  selectedAppId: string | null;
  interfaces: Interface[];
  isLoading: boolean;
  error: string | null;
}

export function DebugPanel({ selectedAppId, interfaces, isLoading, error }: DebugPanelProps) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-xs max-w-md">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>
        <p>Selected App ID: {selectedAppId || 'none'}</p>
        <p>Loading: {isLoading ? 'yes' : 'no'}</p>
        <p>Interface Count: {interfaces.length}</p>
        {error && <p className="text-red-400">Error: {error}</p>}
      </div>
    </div>
  );
} 