// IFS Cloud Technicians API
// Based on "40 - GetTechnicians" Postman request

import { ifsGet } from './ifs-auth';
import { getIFSApiBaseUrl, ifsCloudConfig } from './ifs-config';
import type { Resource } from '@/domain/types';

// IFS Cloud API response types
interface IFSResourceItem {
  ResourceSeq: number;
  ResourceId: string;
  Description: string;
  ServiceOrganizationId: string;
}

interface IFSResourceResponse {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: IFSResourceItem[];
}

/**
 * Get technicians from IFS Cloud
 * Maps IFS Cloud ResourceSet to our Resource[] type
 * 
 * Endpoint: ServiceResourceDetailsHandling.svc/ResourceSet
 * Filters by ResourceParentSeq and ServiceOrganizationId from config
 */
export async function getTechniciansFromIFS(): Promise<Resource[]> {
  const baseUrl = getIFSApiBaseUrl();
  const { resourceGroupSeq, serviceOrganizationId } = ifsCloudConfig;

  // Build URL with OData query parameters
  // Note: We build the query string manually to avoid URLSearchParams encoding $ to %24
  const filter = encodeURIComponent(`(ResourceParentSeq eq ${resourceGroupSeq}) and (ServiceOrganizationId eq '${serviceOrganizationId}')`);
  const select = 'ResourceSeq,ResourceId,Description,ServiceOrganizationId';
  
  const url = `${baseUrl}/ServiceResourceDetailsHandling.svc/ResourceSet?$count=true&$select=${select}&$filter=${filter}`;

  console.debug('Fetching technicians from IFS Cloud...');
  console.debug(`URL: ${url}`);

  const response = await ifsGet<IFSResourceResponse>(url);

  console.debug(`✓ Retrieved ${response.value.length} technicians from IFS Cloud`);

  // Map IFS Cloud response to our Resource type
  return response.value.map((item): Resource => ({
    id: item.ResourceId,
    description: item.Description,
    ResourceSeq: item.ResourceSeq,
    role: 'Technician', // Hardcoded as per specs
    skills: [], // Empty as per specs
  }));
}

/**
 * Get a single technician by ID from IFS Cloud
 */
export async function getTechnicianByIdFromIFS(resourceId: string): Promise<Resource | undefined> {
  const baseUrl = getIFSApiBaseUrl();

  // Build URL manually to avoid encoding $ to %24
  const filter = encodeURIComponent(`ResourceId eq '${resourceId}'`);
  const select = 'ResourceSeq,ResourceId,Description,ServiceOrganizationId';
  
  const url = `${baseUrl}/ServiceResourceDetailsHandling.svc/ResourceSet?$filter=${filter}&$select=${select}`;

  const response = await ifsGet<IFSResourceResponse>(url);

  if (response.value.length === 0) {
    return undefined;
  }

  const item = response.value[0];
  return {
    id: item.ResourceId,
    description: item.Description,
    ResourceSeq: item.ResourceSeq,
    role: 'Technician',
    skills: [],
  };
}
