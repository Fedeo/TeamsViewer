// API route to discover available resources in IFS Cloud (without filters)
// Use this to find the correct ResourceParentSeq and ServiceOrganizationId for your environment

import { NextResponse } from 'next/server';
import { authenticateIFSCloud, isIFSAuthenticated, ifsGet } from '@/lib/api/ifs-auth';
import { getIFSApiBaseUrl } from '@/lib/api/ifs-config';

interface IFSResourceItem {
  ResourceSeq: number;
  ResourceId: string;
  Description: string;
  ServiceOrganizationId?: string;
  ResourceParentSeq?: number;
}

interface IFSResourceResponse {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: IFSResourceItem[];
}

export async function GET() {
  try {
    // Authenticate if needed
    if (!isIFSAuthenticated()) {
      console.log('[Discover] Authenticating with IFS Cloud...');
      await authenticateIFSCloud();
    }
    
    const baseUrl = getIFSApiBaseUrl();
    
    // Fetch top 20 resources without any filter to discover what's available
    // Build URL manually to avoid encoding $ to %24
    const select = 'ResourceSeq,ResourceId,Description,ServiceOrganizationId';
    const url = `${baseUrl}/ServiceResourceDetailsHandling.svc/ResourceSet?$top=20&$count=true&$select=${select}`;
    console.log('[Discover] Fetching resources from:', url);
    
    const response = await ifsGet<IFSResourceResponse>(url);
    
    return NextResponse.json({
      message: 'Resources discovered from IFS Cloud',
      count: response['@odata.count'] || response.value.length,
      resources: response.value,
      hint: 'Use the ResourceSeq values to find parent groups, and ServiceOrganizationId to filter by organization'
    });
  } catch (error) {
    console.error('[Discover] Error:', error);
    return NextResponse.json({
      error: 'Failed to discover resources',
      details: error instanceof Error ? error.message : String(error),
      hint: 'Check your IFS Cloud credentials and permissions'
    }, { status: 500 });
  }
}
