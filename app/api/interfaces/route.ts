import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { fetchInterfacesFromDLAS } from '@/lib/api/dlas';
import { syncInterfacesWithDLAS } from '@/lib/db/interfaces';

// Update column mapping to match all filterable fields
const columnMapping = {
  id: 'id',
  status: 'status',
  direction: 'direction',
  eimInterfaceId: 'eim_interface_id',
  interfaceName: 'interface_name',
  sendAppId: 'send_app_id',
  sendAppName: 'send_app_name',
  receivedAppId: 'received_app_id',
  receivedAppName: 'received_app_name',
  transferType: 'transfer_type',
  frequency: 'frequency',
  pattern: 'pattern',
  technology: 'technology',
  interfaceStatus: 'interface_status',
  priority: 'priority',
  sla: 'sla',
  remarks: 'remarks'
} as const;

export async function GET(request: Request) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    if (!appId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // If force refresh is true, fetch from DLAS first
    if (forceRefresh) {
      try {
        const dlasInterfaces = await fetchInterfacesFromDLAS(appId);
        if (!dlasInterfaces || dlasInterfaces.length === 0) {
          return NextResponse.json({ 
            interfaces: [],
            message: 'No interfaces found in DLAS'
          });
        }
        await syncInterfacesWithDLAS(appId, dlasInterfaces);
      } catch (error) {
        console.error('DLAS fetch error:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch from DLAS',
          details: process.env.NODE_ENV === 'development' ? error : undefined 
        }, { status: 500 });
      }
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy');
    const sortDirection = (searchParams.get('sortDirection') || 'asc').toUpperCase();

    // Map frontend column name to database column name for sorting
    const dbSortColumn = sortBy ? columnMapping[sortBy as keyof typeof columnMapping] : 'id';

    // Build the base query with proper column names
    let queryText = `
      SELECT * FROM interfaces 
      WHERE (send_app_id = $1 OR received_app_id = $1)
    `;
    const queryParams: any[] = [appId];
    let paramCount = 1;

    // Improved filter handling
    const filters = searchParams.get('filters');
    if (filters) {
      try {
        const filterConditions = JSON.parse(filters);
        Object.entries(filterConditions).forEach(([key, value]) => {
          const dbColumnName = columnMapping[key as keyof typeof columnMapping];
          if (!dbColumnName) {
            console.warn(`Invalid filter column: ${key}`);
            return;
          }

          if (Array.isArray(value) && value.length > 0) {
            // Handle array values (checkbox filters)
            paramCount++;
            queryText += ` AND ${dbColumnName} = ANY($${paramCount}::text[])`;
            queryParams.push(value);
          } else if (typeof value === 'string' && value.trim()) {
            // Handle string values (text filters)
            paramCount++;
            queryText += ` AND ${dbColumnName} ILIKE $${paramCount}`;
            queryParams.push(`%${value.trim()}%`);
          } else if (typeof value === 'boolean') {
            // Handle boolean values
            paramCount++;
            queryText += ` AND ${dbColumnName} = $${paramCount}`;
            queryParams.push(value);
          }
        });
      } catch (e) {
        console.error('Filter error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Invalid filter format';
        return NextResponse.json(
          { error: 'Invalid filter format', details: errorMessage },
          { status: 400 }
        );
      }
    }

    // Get total count for pagination
    const countResult = await client.query(
      `SELECT COUNT(*) FROM (${queryText}) AS count_query`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Add sorting
    queryText += ` ORDER BY ${dbSortColumn} ${sortDirection}`;

    // Add pagination
    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(pageSize, (page - 1) * pageSize);

    // Execute final query
    const result = await client.query(queryText, queryParams);

    // Transform the results back to camelCase for frontend
    const interfaces = result.rows.map(row => ({
      id: row.id,
      status: row.status,
      direction: row.direction,
      eimInterfaceId: row.eim_interface_id,
      interfaceName: row.interface_name,
      sendAppId: row.send_app_id,
      sendAppName: row.send_app_name,
      receivedAppId: row.received_app_id,
      receivedAppName: row.received_app_name,
      transferType: row.transfer_type,
      frequency: row.frequency,
      pattern: row.pattern,
      technology: row.technology,
      interfaceStatus: row.interface_status,
      priority: row.priority,
      sla: row.sla,
      remarks: row.remarks
    }));

    // Add error handling for empty results
    if (result.rows.length === 0) {
      return NextResponse.json({
        interfaces: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        message: forceRefresh ? 'No interfaces found in DLAS' : 'No interfaces found in local database'
      });
    }

    return NextResponse.json({
      interfaces,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch interfaces',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

const columnTypes = {
  id: 'string',
  eim_interface_id: 'string',
  interface_name: 'string',
  send_app_id: 'string',
  send_app_name: 'string',
  received_app_id: 'string',
  received_app_name: 'string',
  transfer_type: 'string',
  frequency: 'string',
  pattern: 'string',
  technology: 'string',
  interface_status: 'enum',
  priority: 'enum',
  sla: 'string',
  remarks: 'string'
} as const;

const validateColumnValue = (column: string, value: any) => {
  const type = columnTypes[column as keyof typeof columnTypes];
  if (!type) return false;
  
  if (type === 'enum') {
    const validValues = column === 'priority' 
      ? ['High', 'Medium', 'Low']
      : ['active', 'inactive'];
    return validValues.includes(value);
  }
  
  return typeof value === type;
};