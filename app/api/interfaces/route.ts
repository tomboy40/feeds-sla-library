import { NextResponse } from 'next/server';
import { getInterfacesByApp, syncInterfacesWithDLAS } from '@/lib/db/interfaces';
import { fetchInterfacesFromDLAS } from '@/lib/api/dlas';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  if (!appId || !/^[0-9]{3,8}$/.test(appId)) {
    return NextResponse.json(
      { error: 'Valid application ID (3-8 digits) is required' }, 
      { status: 400 }
    );
  }

  try {
    let interfaces;

    if (forceRefresh) {
      const dlasInterfaces = await fetchInterfacesFromDLAS(
        appId,
        (completed, total) => {
          console.log(`Progress: ${completed}/${total}`);
        }
      );
      await syncInterfacesWithDLAS(appId, dlasInterfaces);
      interfaces = await getInterfacesByApp(appId);
    } else {
      interfaces = await getInterfacesByApp(appId);
      
      if (interfaces.length === 0) {
        const dlasInterfaces = await fetchInterfacesFromDLAS(
          appId,
          (completed, total) => {
            console.log(`Progress: ${completed}/${total}`);
          }
        );
        await syncInterfacesWithDLAS(appId, dlasInterfaces);
        interfaces = await getInterfacesByApp(appId);
      }
    }

    return NextResponse.json(interfaces);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch interfaces' },
      { status: 500 }
    );
  }
}