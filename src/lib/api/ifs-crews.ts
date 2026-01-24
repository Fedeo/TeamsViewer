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
  const { resourceGroupSeq } = ifsCloudConfig;

  // Manual URL building to avoid $ encoding
  const select = 'ResourceSeq,ResourceId,Description';
  const filter = encodeURIComponent(`ResourceParentSeq eq ${resourceGroupSeq}`);
  
  const url = `${baseUrl}/ResourceCrewHandling.svc/ResourceSet?$count=true&$select=${select}&$filter=${filter}`;

  console.debug('Fetching crews from IFS Cloud...');
  const response = await ifsGet<IFSCrewResponse>(url);
  return response.value;
}

/**
 * 2) Get Crew Memberships for a specific crew
 * Endpoint: ResourceCrewHandling.svc/ResourceSet(ResourceSeq={resourceSeq})/ResourceCrewMembersArray
 */
export async function getCrewMembershipsFromIFS(resourceSeq: number): Promise<IFSCrewMemberItem[]> {
  const baseUrl = getIFSApiBaseUrl();

  const select = 'ResourceSeq,ResourceId,PeriodStart,PeriodEnd';
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

  const select = 'ResourceSeq,ResourceId,ValidFrom,ValidTo';
  const url = `${baseUrl}/ResourceCrewHandling.svc/ResourceCrewSet(ResourceSeq=${resourceSeq})/ResourceCrewLeadersArray?$count=true&$select=${select}`;

  console.debug(`Fetching crew leaders for ResourceSeq ${resourceSeq} from IFS Cloud...`);
  const response = await ifsGet<IFSCrewLeaderResponse>(url);
  return response.value;
}
