import { Interface, DLASResponse, DLASInterface } from '@/types/interfaces';
import crypto from 'crypto';

const getDLASBaseUrl = () => {
  if (!process.env.DLAS_API_URL) {
    throw new Error('DLAS API URL is not configured in environment variables');
  }
  return process.env.DLAS_API_URL;
};

export function generateInterfaceId(dlasInterface: DLASInterface): string {
  // Create an array of values in the specified order
  const values = [
    dlasInterface.SendAppID || '',
    dlasInterface.ReceivedAppID || '',
    dlasInterface.EIMInterfaceID || '',
    dlasInterface.InterfaceName || '',
    dlasInterface.TransferType || '',
    dlasInterface.Frequency || '',
    dlasInterface.Technology || '',
    dlasInterface.Pattern || ''
  ];

  // Join values with a delimiter that won't appear in the data
  const key = values.join('|:|');
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function fetchInterfacesFromDLAS(
  appId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Interface[]> {
  try {
    const url = `${getDLASBaseUrl()}?category=interface&appId=${appId}`;
    console.log('Fetching interfaces from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DLAS API error: ${response.statusText}`);
    }
    
    const data: DLASResponse = await response.json();
    console.log('Received DLAS response:', data);

    // Combine both interface arrays
    const dlasInterfaces = [
      ...data.interface.interface_dlas_logged,
      ...data.interface.interface_only_in_eim
    ];

    const interfaces: Interface[] = dlasInterfaces.map(iface => ({
      id: generateInterfaceId(iface),
      status: iface.Status,
      direction: iface.Direction as 'IN' | 'OUT',
      eimInterfaceId: iface.EIMInterfaceID,
      interfaceName: iface.InterfaceName,
      sendAppId: iface.SendAppID,
      sendAppName: iface.SendAppName,
      receivedAppId: iface.ReceivedAppID,
      receivedAppName: iface.ReceivedAppName,
      transferType: iface.TransferType,
      frequency: iface.Frequency,
      technology: iface.Technology,
      pattern: iface.Pattern,
      sla: 'TBD',
      priority: 'Low',
      interfaceStatus: 'active',
      description: null,
      updatedAt: new Date(),
      remarks: null
    }));

    onProgress?.(interfaces.length, interfaces.length);
    return interfaces;
  } catch (error) {
    console.error('Error fetching from DLAS:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching from DLAS');
  }
}