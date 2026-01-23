// IFS Cloud Authentication Module
// Handles OAuth2 password grant flow for IFS Cloud API

import { ifsCloudConfig, getIFSAuthUrl } from './ifs-config';

// Global token storage
let bearerToken: string | null = null;
let tokenExpiresAt: number = 0;

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}

/**
 * Authenticate with IFS Cloud and get bearer token
 * Uses OAuth2 password grant flow
 */
export async function authenticateIFSCloud(): Promise<string> {
  // Check if we have a valid cached token
  if (bearerToken && Date.now() < tokenExpiresAt) {
    return bearerToken;
  }

  const authUrl = getIFSAuthUrl();
  
  // Prepare form data (urlencoded)
  const formData = new URLSearchParams();
  formData.append('client_id', ifsCloudConfig.clientId);
  formData.append('client_secret', ifsCloudConfig.clientSecret);
  formData.append('resource', ifsCloudConfig.clientId);
  formData.append('scope', 'openid');
  formData.append('username', ifsCloudConfig.username);
  formData.append('password', ifsCloudConfig.password);
  formData.append('grant_type', 'password');
  formData.append('response_type', 'id_token token');

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }

    const tokenData: TokenResponse = await response.json();

    // Extract id_token and create bearer token
    if (!tokenData.id_token) {
      throw new Error('No id_token in authentication response');
    }

    // Set global bearer token
    bearerToken = `Bearer ${tokenData.id_token}`;
    
    // Calculate expiration (use expires_in with 1 minute buffer)
    const expiresInMs = (tokenData.expires_in - 60) * 1000;
    tokenExpiresAt = Date.now() + expiresInMs;

    // Print connected message to debug console
    console.debug('✓ Connected to IFS Cloud');
    console.debug(`  Base URL: ${ifsCloudConfig.baseUrl}`);
    console.debug(`  Environment: ${ifsCloudConfig.environmentId}`);
    console.debug(`  User: ${ifsCloudConfig.username}`);
    console.debug(`  Token expires in: ${tokenData.expires_in}s`);

    return bearerToken;
  } catch (error) {
    console.error('IFS Cloud authentication error:', error);
    throw error;
  }
}

/**
 * Get the current bearer token (or authenticate if needed)
 */
export async function getIFSBearerToken(): Promise<string> {
  if (!bearerToken || Date.now() >= tokenExpiresAt) {
    return authenticateIFSCloud();
  }
  return bearerToken;
}

/**
 * Clear the cached token (for logout or error recovery)
 */
export function clearIFSToken(): void {
  bearerToken = null;
  tokenExpiresAt = 0;
  console.debug('IFS Cloud token cleared');
}

/**
 * Check if currently authenticated
 */
export function isIFSAuthenticated(): boolean {
  return bearerToken !== null && Date.now() < tokenExpiresAt;
}

/**
 * Get default headers for IFS Cloud API requests
 */
export async function getIFSRequestHeaders(): Promise<HeadersInit> {
  const token = await getIFSBearerToken();
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': token,
  };
}

/**
 * Make an authenticated GET request to IFS Cloud API
 */
export async function ifsGet<T>(endpoint: string): Promise<T> {
  const headers = await getIFSRequestHeaders();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`IFS API GET failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated POST request to IFS Cloud API
 */
export async function ifsPost<T>(endpoint: string, body: unknown): Promise<T> {
  const headers = await getIFSRequestHeaders();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`IFS API POST failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated PATCH request to IFS Cloud API
 */
export async function ifsPatch<T>(endpoint: string, body: unknown): Promise<T> {
  const headers = await getIFSRequestHeaders();
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`IFS API PATCH failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated DELETE request to IFS Cloud API
 */
export async function ifsDelete(endpoint: string): Promise<void> {
  const headers = await getIFSRequestHeaders();
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error(`IFS API DELETE failed: ${response.status}`);
  }
}
