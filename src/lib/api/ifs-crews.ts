// IFS Cloud Crews API
// Based on "10 - GetCrews", "20 - GetCrewMembership", and "30 - GetCrewLeaders" Postman requests

import { ifsGet } from './ifs-auth';
import { getIFSApiBaseUrl, ifsCloudConfig } from './ifs-config';

// IFS Cloud API response types for Crews
interface IFSCrewItem {
  ResourceSeq: number;
  ResourceId: string;
  Description: string;
}

interface IFSCrewResponse {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: IFSCrewItem[];
}

// IFS Cloud API response types for Crew Memberships
interface IFSCrewMemberItem {
  ResourceSeq: number;
  ResourceMemberSeq: number;
  ResourceId: string;
  PeriodStart: string;
  PeriodEnd: string;
}

interface IFSCrewMemberResponse {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: IFSCrewMemberItem[];
}

// IFS Cloud API response types for Crew Leaders
interface IFSCrewLeaderItem {
  ResourceSeq: number;
  ResourceCrewLeaderSeq: number;
  ResourceId: string;
  ValidFrom: string;
  ValidTo: string;
}

interface IFSCrewLeaderResponse {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: IFSCrewLeaderItem[];
}

/**
 * 1) Get crews from IFS Cloud
 * Endpoint: ResourceCrewHandling.svc/ResourceSet
 */
export async function getCrewsFromIFS(): Promise<IFSCrewItem[]> {
  const baseUrl = getIFSApiBaseUrl();
  const { resourceGroupSeqCrews } = ifsCloudConfig;

  // Validate config
  if (!resourceGroupSeqCrews || isNaN(resourceGroupSeqCrews)) {
    throw new Error(`Invalid resourceGroupSeqCrews: ${resourceGroupSeqCrews}. Check NEXT_PUBLIC_IFS_RESOURCE_GROUP_SEQ_CREWS in .env.local`);
  }

  // Manual URL building to avoid $ encoding
  // Note: encodeURIComponent encodes spaces as %20, which should work for OData
  const select = 'ResourceSeq,ResourceId,Description';
  const filterValue = `ResourceParentSeq eq ${resourceGroupSeqCrews}`;
  // Encode only the filter value, not the $filter= part
  const encodedFilter = encodeURIComponent(filterValue);
  
  // Construct URL manually to ensure $ signs are not encoded
  // Format matches Postman: ResourceParentSeq eq {value} (no parentheses for single condition)
  const url = `${baseUrl}/ResourceCrewHandling.svc/ResourceSet?$count=true&$select=${select}&$filter=${encodedFilter}`;

  console.debug('[IFS Crews] Fetching crews from IFS Cloud...');
  console.debug(`[IFS Crews] Base URL: ${baseUrl}`);
  console.debug(`[IFS Crews] ResourceGroupSeqCrews: ${resourceGroupSeqCrews} (type: ${typeof resourceGroupSeqCrews})`);
  console.debug(`[IFS Crews] Filter (raw): ${filterValue}`);
  console.debug(`[IFS Crews] Filter (encoded): ${encodedFilter}`);
  console.debug(`[IFS Crews] Full URL: ${url}`);

  try {
    const response = await ifsGet<IFSCrewResponse>(url);
    console.debug(`[IFS Crews] Successfully retrieved ${response.value.length} crews`);
    return response.value;
  } catch (error) {
    console.error('[IFS Crews] Error in getCrewsFromIFS:', error);
    // Re-throw with more context
    throw new Error(`Failed to fetch crews: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 2) Get Crew Memberships for a specific crew
 * Endpoint: ResourceCrewHandling.svc/ResourceSet(ResourceSeq={resourceSeq})/ResourceCrewMembersArray
 */
export async function getCrewMembershipsFromIFS(resourceSeq: number): Promise<IFSCrewMemberItem[]> {
  const baseUrl = getIFSApiBaseUrl();

  const select = 'ResourceSeq,ResourceMemberSeq,ResourceId,PeriodStart,PeriodEnd';
  const url = `${baseUrl}/ResourceCrewHandling.svc/ResourceSet(ResourceSeq=${resourceSeq})/ResourceCrewMembersArray?$count=true&$select=${select}`;

  console.debug(`Fetching crew memberships for ResourceSeq ${resourceSeq} from IFS Cloud...`);
  const response = await ifsGet<IFSCrewMemberResponse>(url);
  return response.value;
}

/**
 * 3) Get Crew Leaders for a specific crew
 * Endpoint: ResourceCrewHandling.svc/ResourceCrewSet(ResourceSeq={resourceSeq})/ResourceCrewLeadersArray
 */
export async function getCrewLeadersFromIFS(resourceSeq: number): Promise<IFSCrewLeaderItem[]> {
  const baseUrl = getIFSApiBaseUrl();

  const select = 'ResourceSeq,ResourceCrewLeaderSeq,ResourceId,ValidFrom,ValidTo';
  const url = `${baseUrl}/ResourceCrewHandling.svc/ResourceCrewSet(ResourceSeq=${resourceSeq})/ResourceCrewLeadersArray?$count=true&$select=${select}`;

  console.debug(`Fetching crew leaders for ResourceSeq ${resourceSeq} from IFS Cloud...`);
  const response = await ifsGet<IFSCrewLeaderResponse>(url);
  return response.value;
}
