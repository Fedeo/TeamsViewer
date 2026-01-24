// IFS Cloud API Configuration
// These values should be set via environment variables in production

export interface IFSCloudConfig {
  // Base URL for IFS Cloud instance
  baseUrl: string;
  
  // Authentication realm/environment
  environmentId: string;
  
  // OAuth2 client credentials
  clientId: string;
  clientSecret: string;
  
  // User credentials for password grant
  username: string;
  password: string;
  
  // Resource group configuration
  resourceGroupSeq: number;
  resourceGroupSeqCrews: number;
  serviceOrganizationId: string;
}

// Default configuration - OVERRIDE with environment variables
export const ifsCloudConfig: IFSCloudConfig = {
  // IFS Cloud instance URL (without protocol)
  baseUrl: process.env.NEXT_PUBLIC_IFS_BASE_URL || 'ifspsc2-d09.demo.ifs.cloud',
  
  // Keycloak realm/environment ID
  environmentId: process.env.NEXT_PUBLIC_IFS_ENVIRONMENT_ID || 'psc2d091',
  
  // OAuth2 client credentials
  clientId: process.env.IFS_CLIENT_ID || 'Postman-API',
  clientSecret: process.env.IFS_CLIENT_SECRET || '',
  
  // User credentials (for development only - use proper auth flow in production)
  username: process.env.IFS_USERNAME || '',
  password: process.env.IFS_PASSWORD || '',
  
  // Resource configuration for crew/technician queries
  resourceGroupSeq: parseInt(process.env.NEXT_PUBLIC_IFS_RESOURCE_GROUP_SEQ || '1937', 10),
  resourceGroupSeqCrews: parseInt(process.env.NEXT_PUBLIC_IFS_RESOURCE_GROUP_SEQ_CREWS || '1938', 10),
  serviceOrganizationId: process.env.NEXT_PUBLIC_IFS_SERVICE_ORG_ID || '2501',
};

// Helper to get full URLs
export function getIFSAuthUrl(): string {
  return `https://${ifsCloudConfig.baseUrl}/auth/realms/${ifsCloudConfig.environmentId}/protocol/openid-connect/token`;
}

export function getIFSApiBaseUrl(): string {
  return `https://${ifsCloudConfig.baseUrl}/main/ifsapplications/projection/v1`;
}
