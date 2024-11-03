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

export async function fetchInterfacesFromDLAS(appId: string): Promise<Interface[]> {
  try {
    const DLAS_BASE_URL = getDLASBaseUrl();
    const url = `${DLAS_BASE_URL.details}?appId=${appId}`;
    console.log('Fetching interface details from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      next: {
        revalidate: 0
      }
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    if (!response.ok) {
      throw new Error(`DLAS API error: ${response.statusText}`);
    }
    const data: DLASInterfaceDetailsResponse[] = await response.json();
    console.log('Raw DLAS response:', data);

    // Transform the interface details into our Interface type
    const interfaces: Interface[] = data.map(detail => ({
      id: detail.interface.interface_id,
      name: detail.interface.interface_name,
      senderAppId: detail.interface.senderappid,
      senderAppName: detail.interface.senderappname,
      receiverAppId: detail.interface.receiverappid,
      receiverAppName: detail.interface.receiverappname,
      transferType: detail.interface.transfertype,
      frequency: detail.interface.frequency,
      productType: detail.product_type?.[0]?.primaryProductType?.[0] || 'Unknown',
      entity: detail.business_context?.[0]?.le || 'Unknown',
      sla: 'TBD',
      impact: 'Medium',
      status: 'active',
      updatedAt: new Date()
    }));
    
    // Filter for the requested appId - ensure string comparison
    const filteredInterfaces = interfaces.filter(iface => 
      iface.senderAppId.trim() === appId.trim() || iface.receiverAppId.trim() === appId.trim()
    );
    
    console.log('Filtered interfaces for appId:', appId, 'Count:', filteredInterfaces.length);
    console.log('Filtered interfaces:', filteredInterfaces);
    return filteredInterfaces;
  } catch (error) {
    console.error('Error fetching interface details:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out while connecting to DLAS');
      }
      if (error.message.includes('EAI_AGAIN')) {
        throw new Error('Network error: Unable to resolve DLAS hostname. Please check your network connection or DNS settings.');
      }
    }
    throw new Error('Failed to fetch interface details from DLAS');
  }
}