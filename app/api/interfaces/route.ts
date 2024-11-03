import { NextResponse } from 'next/server';
import { getInterfacesByApp, syncInterfacesWithDLAS } from '@/lib/db/interfaces';
import { fetchInterfacesFromDLAS } from '@/lib/api/dlas';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  console.log('API Request - appId:', appId, 'forceRefresh:', forceRefresh);

  if (!appId || !/^[0-9]{3,8}$/.test(appId)) {
    return NextResponse.json(
      { error: 'Valid application ID (3-8 digits) is required' }, 
      { status: 400 }
    );
  }

  try {
    let interfaces;

    if (forceRefresh) {
      console.log('Force refreshing interfaces from DLAS');
      const dlasInterfaces = await fetchInterfacesFromDLAS(appId);
      console.log('DLAS Interfaces before sync:', dlasInterfaces);
      await syncInterfacesWithDLAS(appId, dlasInterfaces);
      interfaces = await getInterfacesByApp(appId);
      console.log('Interfaces after sync:', interfaces);
    } else {
      interfaces = await getInterfacesByApp(appId);
      console.log('Initial DB interfaces:', interfaces);
      
      if (interfaces.length === 0) {
        console.log('No interfaces in DB, fetching from DLAS');
        const dlasInterfaces = await fetchInterfacesFromDLAS(appId);
        console.log('DLAS Interfaces before sync:', dlasInterfaces);
        await syncInterfacesWithDLAS(appId, dlasInterfaces);
        interfaces = await getInterfacesByApp(appId);
        console.log('Interfaces after sync:', interfaces);
      }
    }

    console.log('Final interfaces to return:', interfaces);
    return NextResponse.json(interfaces);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch interfaces' },
      { status: 500 }
    );
  }
}