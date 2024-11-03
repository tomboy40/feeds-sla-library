import { NextRequest, NextResponse } from 'next/server';
import { getInterfaceById, updateInterface } from '@/lib/db/interfaces';
import { InterfaceUpdatePayload } from '@/types/interfaces';

export async function PATCH(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const interfaceId = context.params.id as string;
    const updates: InterfaceUpdatePayload = await request.json();

    // Get the interface first
    const existingInterface = await getInterfaceById(interfaceId);
    if (!existingInterface) {
      return NextResponse.json(
        { error: 'Interface not found' },
        { status: 404 }
      );
    }

    await updateInterface(interfaceId, updates);
    
    // Get the updated interface
    const updatedInterface = await getInterfaceById(interfaceId);
    
    return NextResponse.json({ 
      success: true,
      interface: updatedInterface
    });
  } catch (error) {
    console.error('Error updating interface:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update interface' },
      { status: 500 }
    );
  }
} 