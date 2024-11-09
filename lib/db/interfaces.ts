import { Interface, InterfaceUpdatePayload } from '@/types/interfaces';
import pool from './index';

export async function updateInterface(
  id: string,
  updates: InterfaceUpdatePayload
): Promise<void> {
  if (!id) throw new Error('Interface ID is required');
  
  const query = `
    UPDATE interfaces 
    SET sla = $1, 
        priority = $2,
        interface_status = $3,
        remarks = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    updates.sla || 'TBD',
    updates.priority || 'Medium',
    updates.interfaceStatus || 'active',
    updates.remarks,
    id
  ]);

  if (result.rowCount === 0) {
    throw new Error('Interface not found');
  }
}

export async function getInterfacesByApp(appId: string): Promise<Interface[]> {
  if (!appId) return [];
  
  const query = `
    SELECT 
      id,
      status,
      direction,
      eim_interface_id as "eimInterfaceId",
      interface_name as "interfaceName",
      send_app_id as "sendAppId",
      send_app_name as "sendAppName",
      received_app_id as "receivedAppId",
      received_app_name as "receivedAppName",
      transfer_type as "transferType",
      frequency,
      technology,
      pattern,
      sla,
      priority,
      interface_status as "interfaceStatus",
      remarks,
      updated_at as "updatedAt"
    FROM interfaces 
    WHERE (send_app_id = $1 OR received_app_id = $1)
    ORDER BY updated_at DESC
  `;
  
  const result = await pool.query(query, [appId]);
  return result.rows;
}

export async function syncInterfacesWithDLAS(appId: string, interfaces: Interface[]): Promise<void> {
  if (!appId) throw new Error('App ID is required');
  if (!Array.isArray(interfaces)) throw new Error('Interfaces must be an array');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get existing interfaces
    const existingResult = await client.query(
      'SELECT id, sla, priority, interface_status, remarks FROM interfaces WHERE send_app_id = $1 OR received_app_id = $1',
      [appId]
    );
    
    const existingInterfaces = new Map(
      existingResult.rows.map(row => [row.id, row])
    );
    const newIds = new Set(interfaces.map(iface => iface.id));

    // Mark non-existing interfaces as inactive
    const toInactiveIds = Array.from(existingInterfaces.keys())
      .filter(id => !newIds.has(id));
      
    if (toInactiveIds.length > 0) {
      await client.query(`
        UPDATE interfaces 
        SET interface_status = 'inactive', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($1)
      `, [toInactiveIds]);
    }

    // Upsert interfaces
    for (const iface of interfaces) {
      const existing = existingInterfaces.get(iface.id);
      await client.query(`
        INSERT INTO interfaces (
          id, status, direction, eim_interface_id, interface_name,
          send_app_id, send_app_name, received_app_id, received_app_name,
          transfer_type, frequency, technology, pattern,
          sla, priority, interface_status, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          direction = EXCLUDED.direction,
          eim_interface_id = EXCLUDED.eim_interface_id,
          interface_name = EXCLUDED.interface_name,
          send_app_name = EXCLUDED.send_app_name,
          received_app_name = EXCLUDED.received_app_name,
          transfer_type = EXCLUDED.transfer_type,
          frequency = EXCLUDED.frequency,
          technology = EXCLUDED.technology,
          pattern = EXCLUDED.pattern,
          interface_status = 'active',
          updated_at = CURRENT_TIMESTAMP,
          sla = COALESCE(interfaces.sla, EXCLUDED.sla),
          priority = COALESCE(interfaces.priority, EXCLUDED.priority),
          remarks = COALESCE(interfaces.remarks, EXCLUDED.remarks)
      `, [
        iface.id,
        iface.status,
        iface.direction,
        iface.eimInterfaceId,
        iface.interfaceName,
        iface.sendAppId,
        iface.sendAppName,
        iface.receivedAppId,
        iface.receivedAppName,
        iface.transferType,
        iface.frequency,
        iface.technology,
        iface.pattern,
        'TBD',
        'Medium',
        'active',
        null
      ]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getInterfaceById(id: string): Promise<Interface | null> {
  if (!id) throw new Error('Interface ID is required');
  
  const query = `
    SELECT 
      id,
      status,
      direction,
      eim_interface_id as "eimInterfaceId",
      interface_name as "interfaceName",
      send_app_id as "sendAppId",
      send_app_name as "sendAppName",
      received_app_id as "receivedAppId",
      received_app_name as "receivedAppName",
      transfer_type as "transferType",
      frequency,
      technology,
      pattern,
      sla,
      priority,
      interface_status as "interfaceStatus",
      remarks,
      updated_at as "updatedAt"
    FROM interfaces 
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}