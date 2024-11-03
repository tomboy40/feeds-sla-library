import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
};

const pool = new Pool(poolConfig);

export async function getInterfacesByApp(appId: string): Promise<any[]> {
  const query = `
    SELECT * FROM interfaces 
    WHERE (sender_app_id = $1 OR receiver_app_id = $1)
    AND status != 'demised'
    ORDER BY updated_at DESC
  `;
  const result = await pool.query(query, [appId]);
  return result.rows;
}

export async function syncInterfacesWithDLAS(
  appId: string,
  dlasInterfaces: any[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get existing interfaces for the app
    const existingQuery = `
      SELECT id, status
      FROM interfaces
      WHERE (sender_app_id = $1 OR receiver_app_id = $1)
      AND status != 'demised'
    `;
    const { rows: existingInterfaces } = await client.query(existingQuery, [appId]);
    const existingIds = new Set(existingInterfaces.map(i => i.id));
    const dlasIds = new Set(dlasInterfaces.map(i => i.id));

    // Mark interfaces as demised if they're not in DLAS response
    const toBeMarkedDemised = [...existingIds].filter(id => !dlasIds.has(id));
    if (toBeMarkedDemised.length > 0) {
      const demiseQuery = `
        UPDATE interfaces
        SET status = 'demised', updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($1)
      `;
      await client.query(demiseQuery, [toBeMarkedDemised]);
    }

    // Upsert interfaces from DLAS
    for (const iface of dlasInterfaces) {
      const upsertQuery = `
        INSERT INTO interfaces (
          id, name, sender_app_id, sender_app_name, 
          receiver_app_id, receiver_app_name, transfer_type, 
          frequency, product_type, entity, sla, impact,
          status, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          sender_app_id = EXCLUDED.sender_app_id,
          sender_app_name = EXCLUDED.sender_app_name,
          receiver_app_id = EXCLUDED.receiver_app_id,
          receiver_app_name = EXCLUDED.receiver_app_name,
          transfer_type = EXCLUDED.transfer_type,
          frequency = EXCLUDED.frequency,
          product_type = EXCLUDED.product_type,
          entity = EXCLUDED.entity,
          sla = EXCLUDED.sla,
          impact = EXCLUDED.impact,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await client.query(upsertQuery, [
        iface.id, iface.name, iface.senderAppId, iface.senderAppName,
        iface.receiverAppId, iface.receiverAppName, iface.transferType,
        iface.frequency, iface.productType, iface.entity, iface.sla, iface.impact
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