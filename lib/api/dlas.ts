import { Interface, DLASInterfaceResponse, DLASInterfaceDetailsResponse } from '@/types/interfaces';

const getDLASBaseUrl = () => {
  if (!process.env.DLAS_API_INTERFACES_URL || !process.env.DLAS_API_DETAILS_URL) {
    throw new Error('DLAS API URLs are not configured in environment variables');
  }

  return {
    interfaces: process.env.DLAS_API_INTERFACES_URL,
    details: process.env.DLAS_API_DETAILS_URL
  };
};

async function fetchInterfaceConnections(appId: string): Promise<DLASInterfaceResponse> {
  const DLAS_BASE_URL = getDLASBaseUrl();
  try {
    const url = `${DLAS_BASE_URL.interfaces}?appId=${appId}`;
    console.log('Fetching interface connections from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DLAS API error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Received interface connections:', data);
    return data as DLASInterfaceResponse;
  } catch (error) {
    console.error('Error fetching interface connections:', error);
    throw new Error('Failed to fetch interface connections from DLAS');
  }
}

async function fetchInterfaceDetails(senderAppId: string, receiverAppId: string): Promise<DLASInterfaceDetailsResponse | null> {
  const DLAS_BASE_URL = getDLASBaseUrl();
  try {
    const url = `${DLAS_BASE_URL.details}?receiverAppId=${receiverAppId}&senderAppId=${senderAppId}`;
    console.log('Fetching interface details from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DLAS API error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Received interface details:', data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected an array');
    }
    
    // Return null if no data found
    if (data.length === 0) {
      console.log(`No interface details found for sender=${senderAppId}, receiver=${receiverAppId}`);
      return null;
    }
    
    return data[0] as DLASInterfaceDetailsResponse;
  } catch (error) {
    console.error('Error fetching interface details:', error);
    throw new Error(`Failed to fetch interface details for sender ${senderAppId} and receiver ${receiverAppId}`);
  }
}

const BATCH_SIZE = 5; // Number of parallel requests to make at once

export async function fetchInterfacesFromDLAS(appId: string, 
  onProgress?: (completed: number, total: number) => void
): Promise<Interface[]> {
  try {
    // First, get all interface connections for the app
    const connections = await fetchInterfaceConnections(appId);
    console.log('Fetched connections:', connections);
    
    if (!connections.data || !connections.links || !Array.isArray(connections.links)) {
      throw new Error('Invalid response format from DLAS interfaces endpoint');
    }

    const total = connections.links.length;
    let completed = 0;

    // Process links in batches
    const interfaces: Interface[] = [];
    for (let i = 0; i < connections.links.length; i += BATCH_SIZE) {
      const batch = connections.links.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async ({ source, target }) => {
        try {
          const details = await fetchInterfaceDetails(source, target);
          completed++;
          onProgress?.(completed, total);
          
          if (!details) return null;

          const { interface: iface, business_context, product_type } = details;
          return {
            id: iface.interface_id,
            name: iface.interface_name,
            senderAppId: source,
            senderAppName: iface.senderappname,
            receiverAppId: target,
            receiverAppName: iface.receiverappname,
            transferType: iface.transfertype,
            frequency: iface.frequency,
            productType: product_type[0]?.primaryProductType[0] || 'Unknown',
            entity: business_context[0]?.le || 'Unknown',
            sla: 'TBD',
            impact: 'Medium',
            status: 'active',
            updatedAt: new Date()
          } as Interface;
        } catch (error) {
          console.error(`Failed to fetch details for source=${source}, target=${target}:`, error);
          completed++;
          onProgress?.(completed, total);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      interfaces.push(...batchResults.filter((result): result is Interface => result !== null));
    }

    return interfaces;
  } catch (error) {
    console.error('Error fetching from DLAS:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching from DLAS');
  }
}