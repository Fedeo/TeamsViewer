// API route to get crew memberships from IFS Cloud for manual verification

import { NextResponse } from 'next/server';
import { getCrewMembershipsFromIFS } from '@/lib/api/ifs-crews';
import { authenticateIFSCloud, isIFSAuthenticated } from '@/lib/api/ifs-auth';

export async function GET(
  request: Request,
  { params }: { params: { resourceSeq: string } }
) {
  const useIFSCloud = process.env.NEXT_PUBLIC_USE_IFS_CLOUD === 'true';
  const resourceSeq = parseInt(params.resourceSeq, 10);

  if (!useIFSCloud) {
    return NextResponse.json({ error: 'IFS Cloud integration is disabled' }, { status: 400 });
  }

  if (isNaN(resourceSeq)) {
    return NextResponse.json({ error: 'Invalid ResourceSeq parameter' }, { status: 400 });
  }
  
  try {
    if (!isIFSAuthenticated()) {
      await authenticateIFSCloud();
    }
    
    const memberships = await getCrewMembershipsFromIFS(resourceSeq);
    return NextResponse.json(memberships);
  } catch (error) {
    console.error(`[API Route] Error fetching memberships for ${resourceSeq}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch memberships',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
