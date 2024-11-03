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
        impact = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    updates.sla || 'TBD',
    updates.impact || 'Medium',
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
      name,
      sender_app_id as "senderAppId",
      sender_app_name as "senderAppName",
      receiver_app_id as "receiverAppId",
      receiver_app_name as "receiverAppName",
      transfer_type as "transferType",
      frequency,
      product_type as "productType",
      entity,
      sla,
      impact,
      status,
      updated_at as "updatedAt"
    FROM interfaces 
    WHERE (sender_app_id = $1 OR receiver_app_id = $1)
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
      'SELECT id, sla, impact FROM interfaces WHERE sender_app_id = $1 OR receiver_app_id = $1',
      [appId]
    );
    
    const existingInterfaces = new Map(
      existingResult.rows.map(row => [row.id, { sla: row.sla, impact: row.impact }])
    );
    const newIds = new Set(interfaces.map(iface => iface.id));

    // Mark non-existing interfaces as demised
    const todemiseIds = Array.from(existingInterfaces.keys())
      .filter(id => !newIds.has(id));
      
    if (todemiseIds.length > 0) {
      await client.query(`
        UPDATE interfaces 
        SET status = 'demised', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($1)
      `, [todemiseIds]);
    }

    // Upsert interfaces
    for (const iface of interfaces) {
      const existing = existingInterfaces.get(iface.id);
      await client.query(`
        INSERT INTO interfaces (
          id, name, sender_app_id, sender_app_name, 
          receiver_app_id, receiver_app_name, transfer_type, 
          frequency, product_type, entity, sla, impact, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          sender_app_name = EXCLUDED.sender_app_name,
          receiver_app_name = EXCLUDED.receiver_app_name,
          transfer_type = EXCLUDED.transfer_type,
          frequency = EXCLUDED.frequency,
          product_type = EXCLUDED.product_type,
          entity = EXCLUDED.entity,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP,
          sla = CASE 
            WHEN interfaces.status = 'demised' THEN 'TBD'
            ELSE interfaces.sla
          END,
          impact = CASE 
            WHEN interfaces.status = 'demised' THEN 'Medium'
            ELSE interfaces.impact
          END
      `, [
        iface.id,
        iface.name,
        iface.senderAppId,
        iface.senderAppName,
        iface.receiverAppId,
        iface.receiverAppName,
        iface.transferType,
        iface.frequency,
        iface.productType,
        iface.entity,
        existing?.sla || 'TBD',
        existing?.impact || 'Medium'
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
      name,
      sender_app_id as "senderAppId",
      sender_app_name as "senderAppName",
      receiver_app_id as "receiverAppId",
      receiver_app_name as "receiverAppName",
      transfer_type as "transferType",
      frequency,
      product_type as "productType",
      entity,
      sla,
      impact,
      status,
      updated_at as "updatedAt"
    FROM interfaces 
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}