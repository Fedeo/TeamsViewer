import {
  authenticateIFSCloud,
  getIFSBearerToken,
  clearIFSToken,
  isIFSAuthenticated,
  getIFSRequestHeaders,
} from '../ifs-auth';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Sample successful token response
const mockTokenResponse = {
  access_token: 'access-token-123',
  expires_in: 300, // 5 minutes
  refresh_expires_in: 1800,
  refresh_token: 'refresh-token-456',
  token_type: 'Bearer',
  id_token: 'id-token-789',
  'not-before-policy': 0,
  session_state: 'session-123',
  scope: 'openid',
};

describe('IFS Cloud Authentication', () => {
  beforeEach(() => {
    // Clear token before each test
    clearIFSToken();
    mockFetch.mockReset();
    mockConsoleDebug.mockClear();
    mockConsoleError.mockClear();
  });

  describe('authenticateIFSCloud', () => {
    it('should successfully authenticate and return bearer token', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const token = await authenticateIFSCloud();

      // Verify token format
      expect(token).toBe('Bearer id-token-789');

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      
      expect(url).toContain('/auth/realms/');
      expect(url).toContain('/protocol/openid-connect/token');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      // Verify form data
      const body = options.body;
      expect(body).toContain('grant_type=password');
      expect(body).toContain('scope=openid');
      expect(body).toContain('response_type=id_token+token');

      // Verify debug message
      expect(mockConsoleDebug).toHaveBeenCalledWith('✓ Connected to IFS Cloud');
    });

    it('should throw error when authentication fails', async () => {
      // Mock failed response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      });

      await expect(authenticateIFSCloud()).rejects.toThrow('Authentication failed: 401');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should throw error when id_token is missing', async () => {
      // Mock response without id_token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTokenResponse, id_token: undefined }),
      });

      await expect(authenticateIFSCloud()).rejects.toThrow('No id_token in authentication response');
    });

    it('should throw error on network failure', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authenticateIFSCloud()).rejects.toThrow('Network error');
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('getIFSBearerToken', () => {
    it('should return cached token if still valid', async () => {
      // First call - authenticate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const token1 = await getIFSBearerToken();
      const token2 = await getIFSBearerToken();

      // Should only fetch once (token cached)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(token1).toBe(token2);
    });

    it('should re-authenticate when token is cleared', async () => {
      // Setup mock to return token twice
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await getIFSBearerToken();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear token
      clearIFSToken();

      await getIFSBearerToken();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('isIFSAuthenticated', () => {
    it('should return false before authentication', () => {
      expect(isIFSAuthenticated()).toBe(false);
    });

    it('should return true after authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await authenticateIFSCloud();
      expect(isIFSAuthenticated()).toBe(true);
    });

    it('should return false after clearing token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await authenticateIFSCloud();
      expect(isIFSAuthenticated()).toBe(true);

      clearIFSToken();
      expect(isIFSAuthenticated()).toBe(false);
    });
  });

  describe('getIFSRequestHeaders', () => {
    it('should return headers with Authorization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const headers = await getIFSRequestHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer id-token-789',
      });
    });
  });

  describe('clearIFSToken', () => {
    it('should clear the cached token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await authenticateIFSCloud();
      expect(isIFSAuthenticated()).toBe(true);

      clearIFSToken();
      expect(isIFSAuthenticated()).toBe(false);
      expect(mockConsoleDebug).toHaveBeenCalledWith('IFS Cloud token cleared');
    });
  });
});
