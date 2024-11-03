import { Interface } from '@/types/interfaces';
import { mockDLASResponse } from './dlas-stub';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function fetchInterfacesFromDLAS(appId: string): Promise<Interface[]> {
  try {
    if (isDevelopment) {
      // Use mock data in development
      return await mockDLASResponse(appId);
    }

    // In production, use the real DLAS API
    const response = await fetch(`${process.env.DLAS_API_URL}/interfaces/${appId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.DLAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`DLAS API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from DLAS:', error);
    throw error;
  }
}