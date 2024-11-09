import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table"

export function InterfaceTable() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SLA Library</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <span className="mr-2">⬇️</span>
            Export to CSV
          </Button>
          <Button variant="outline">
            <span className="mr-2">🔄</span>
            Retrieve Latest from DLAS
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="flex gap-4">
        <Input 
          placeholder="Search by application ID" 
          className="max-w-md"
        />
      </div>

      {/* Table Section */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Interface Name</TableHead>
            <TableHead>EIM ID</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Receiver</TableHead>
            <TableHead>Transfer Type</TableHead>
            <TableHead>Technology</TableHead>
            <TableHead>Pattern</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* If no data */}
          <TableRow>
            <td colSpan={12} className="text-center py-4 text-gray-500">
              No interfaces found
            </td>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
} 