// API route to get crews from IFS Cloud for manual verification

import { NextResponse } from 'next/server';
import { getCrewsFromIFS } from '@/lib/api/ifs-crews';
import { authenticateIFSCloud, isIFSAuthenticated, getIFSBearerToken } from '@/lib/api/ifs-auth';

export async function GET() {
  const useIFSCloud = process.env.NEXT_PUBLIC_USE_IFS_CLOUD === 'true';
  
  console.log('[API Route] GET /api/crews, USE_IFS_CLOUD:', useIFSCloud);
  
  if (!useIFSCloud) {
    return NextResponse.json({ error: 'IFS Cloud integration is disabled. Enable it in .env.local' }, { status: 400 });
  }
  
  try {
    // Force fresh authentication for crews endpoint
    console.log('[API Route] Authenticating with IFS Cloud...');
    const token = await authenticateIFSCloud();
    console.log('[API Route] Authentication successful, token length:', token?.length || 0);
    
    // Fetch crews from IFS Cloud
    console.log('[API Route] Fetching crews from IFS Cloud...');
    const crews = await getCrewsFromIFS();
    console.log(`[API Route] Retrieved ${crews.length} crews from IFS Cloud`);
    
    return NextResponse.json(crews);
  } catch (error) {
    console.error('[API Route] Error fetching crews:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API Route] Error details:', errorMessage);
    
    // If it's a 401, provide more specific guidance
    if (errorMessage.includes('401') || errorMessage.includes('Authorization')) {
      return NextResponse.json({ 
        error: 'Authentication failed - 401 Authorization Required',
        details: errorMessage,
        suggestion: 'Please verify your IFS Cloud credentials in .env.local (IFS_CLIENT_ID, IFS_CLIENT_SECRET, IFS_USERNAME, IFS_PASSWORD)'
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch crews from IFS Cloud',
      details: errorMessage
    }, { status: 500 });
  }
}
