// API route to get crews from IFS Cloud for manual verification

import { NextResponse } from 'next/server';
import { getCrewsFromIFS } from '@/lib/api/ifs-crews';
import { authenticateIFSCloud, isIFSAuthenticated } from '@/lib/api/ifs-auth';

export async function GET() {
  const useIFSCloud = process.env.NEXT_PUBLIC_USE_IFS_CLOUD === 'true';
  
  if (!useIFSCloud) {
    return NextResponse.json({ error: 'IFS Cloud integration is disabled. Enable it in .env.local' }, { status: 400 });
  }
  
  try {
    if (!isIFSAuthenticated()) {
      await authenticateIFSCloud();
    }
    
    const crews = await getCrewsFromIFS();
    return NextResponse.json(crews);
  } catch (error) {
    console.error('[API Route] Error fetching crews:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch crews from IFS Cloud',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
