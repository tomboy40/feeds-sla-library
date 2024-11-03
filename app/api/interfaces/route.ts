import { NextResponse } from 'next/server';
import { getInterfacesByApp, syncInterfacesWithDLAS } from '@/lib/db/interfaces';
import { fetchInterfacesFromDLAS } from '@/lib/api/dlas';
import { Interface } from '@/types/interfaces';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  if (!appId) {
    return NextResponse.json(
      { error: 'Application ID is required' }, 
      { status: 400 }
    );
  }

  try {
    let interfaces: Interface[];

    if (forceRefresh) {
      // Force refresh: fetch from DLAS and sync with DB
      const dlasInterfaces = await fetchInterfacesFromDLAS(appId);
      await syncInterfacesWithDLAS(appId, dlasInterfaces);
      interfaces = await getInterfacesByApp(appId);
    } else {
      // Try to get from DB first
      interfaces = await getInterfacesByApp(appId);
      
      if (interfaces.length === 0) {
        // If not in DB, fetch from DLAS and sync
        const dlasInterfaces = await fetchInterfacesFromDLAS(appId);
        await syncInterfacesWithDLAS(appId, dlasInterfaces);
        interfaces = await getInterfacesByApp(appId);
      }
    }

    return NextResponse.json(interfaces);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interfaces' },
      { status: 500 }
    );
  }
}