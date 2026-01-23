// Server-side API route for fetching technicians from IFS Cloud
// This route handles authentication securely on the server

import { NextResponse } from 'next/server';
import { getTechniciansFromIFS } from '@/lib/api/ifs-technicians';
import { authenticateIFSCloud, isIFSAuthenticated } from '@/lib/api/ifs-auth';

// Mock data fallback
const mockTechnicians = [
  { id: 'tech-001', description: 'James Wilson', ResourceSeq: 1001, role: 'Technician', skills: [] },
  { id: 'tech-002', description: 'Sarah Mitchell', ResourceSeq: 1002, role: 'Technician', skills: [] },
  { id: 'tech-003', description: 'Michael Thompson', ResourceSeq: 1003, role: 'Technician', skills: [] },
  { id: 'tech-004', description: 'Emma Davies', ResourceSeq: 1004, role: 'Technician', skills: [] },
  { id: 'tech-005', description: 'Oliver Brown', ResourceSeq: 1005, role: 'Technician', skills: [] },
  { id: 'tech-006', description: 'Charlotte Taylor', ResourceSeq: 1006, role: 'Technician', skills: [] },
  { id: 'tech-007', description: 'William Anderson', ResourceSeq: 1007, role: 'Technician', skills: [] },
  { id: 'tech-008', description: 'Amelia Roberts', ResourceSeq: 1008, role: 'Technician', skills: [] },
];

export async function GET() {
  const useIFSCloud = process.env.NEXT_PUBLIC_USE_IFS_CLOUD === 'true';
  
  console.log('[API Route] GET /api/technicians, USE_IFS_CLOUD:', useIFSCloud);
  
  if (!useIFSCloud) {
    console.log('[API Route] Returning mock data');
    return NextResponse.json(mockTechnicians);
  }
  
  try {
    // Authenticate if needed
    if (!isIFSAuthenticated()) {
      console.log('[API Route] Authenticating with IFS Cloud...');
      await authenticateIFSCloud();
    }
    
    // Fetch technicians from IFS Cloud
    console.log('[API Route] Fetching technicians from IFS Cloud...');
    const technicians = await getTechniciansFromIFS();
    console.log(`[API Route] Retrieved ${technicians.length} technicians from IFS Cloud`);
    
    return NextResponse.json(technicians);
  } catch (error) {
    console.error('[API Route] Error fetching from IFS Cloud:', error);
    console.log('[API Route] Falling back to mock data');
    return NextResponse.json(mockTechnicians);
  }
}
