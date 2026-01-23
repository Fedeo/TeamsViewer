import { getTechniciansFromIFS, getTechnicianByIdFromIFS } from '../ifs-technicians';
import * as ifsAuth from '../ifs-auth';

// Mock the ifs-auth module
jest.mock('../ifs-auth', () => ({
  ifsGet: jest.fn(),
}));

// Mock console methods
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

// Sample IFS Cloud response
const mockIFSResponse = {
  '@odata.context': 'https://example.ifs.cloud/...',
  '@odata.count': 3,
  value: [
    {
      ResourceSeq: 1001,
      ResourceId: 'TECH001',
      Description: 'John Smith',
      ServiceOrganizationId: '2501',
    },
    {
      ResourceSeq: 1002,
      ResourceId: 'TECH002',
      Description: 'Jane Doe',
      ServiceOrganizationId: '2501',
    },
    {
      ResourceSeq: 1003,
      ResourceId: 'TECH003',
      Description: 'Bob Johnson',
      ServiceOrganizationId: '2501',
    },
  ],
};

describe('IFS Cloud Technicians API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTechniciansFromIFS', () => {
    it('should fetch and map technicians correctly', async () => {
      // Setup mock
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce(mockIFSResponse);

      const technicians = await getTechniciansFromIFS();

      // Verify API was called
      expect(ifsAuth.ifsGet).toHaveBeenCalledTimes(1);
      
      // Verify URL contains correct endpoint and parameters
      const calledUrl = (ifsAuth.ifsGet as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('ServiceResourceDetailsHandling.svc/ResourceSet');
      // Note: URLSearchParams encodes special chars like $ to %24
      expect(calledUrl).toContain('%24count=true'); // $count encoded
      expect(calledUrl).toContain('ResourceSeq');
      expect(calledUrl).toContain('%24filter='); // $filter encoded
      expect(calledUrl).toContain('ResourceParentSeq');
      expect(calledUrl).toContain('ServiceOrganizationId');

      // Verify returned data structure
      expect(technicians).toHaveLength(3);
      
      expect(technicians[0]).toEqual({
        id: 'TECH001',
        description: 'John Smith',
        ResourceSeq: 1001,
        role: 'Technician',
        skills: [],
      });

      expect(technicians[1]).toEqual({
        id: 'TECH002',
        description: 'Jane Doe',
        ResourceSeq: 1002,
        role: 'Technician',
        skills: [],
      });

      expect(technicians[2]).toEqual({
        id: 'TECH003',
        description: 'Bob Johnson',
        ResourceSeq: 1003,
        role: 'Technician',
        skills: [],
      });

      // Verify debug messages
      expect(mockConsoleDebug).toHaveBeenCalledWith('Fetching technicians from IFS Cloud...');
      expect(mockConsoleDebug).toHaveBeenCalledWith('✓ Retrieved 3 technicians from IFS Cloud');
    });

    it('should return empty array when no technicians found', async () => {
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce({
        '@odata.count': 0,
        value: [],
      });

      const technicians = await getTechniciansFromIFS();

      expect(technicians).toHaveLength(0);
      expect(mockConsoleDebug).toHaveBeenCalledWith('✓ Retrieved 0 technicians from IFS Cloud');
    });

    it('should propagate errors from API', async () => {
      (ifsAuth.ifsGet as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await expect(getTechniciansFromIFS()).rejects.toThrow('API Error');
    });

    it('should map all required fields correctly', async () => {
      const singleItemResponse = {
        value: [
          {
            ResourceSeq: 9999,
            ResourceId: 'UNIQUE-ID',
            Description: 'Test Technician Name',
            ServiceOrganizationId: 'ORG123',
          },
        ],
      };

      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce(singleItemResponse);

      const [technician] = await getTechniciansFromIFS();

      // Verify mapping
      expect(technician.id).toBe('UNIQUE-ID');
      expect(technician.description).toBe('Test Technician Name');
      expect(technician.ResourceSeq).toBe(9999);
      expect(technician.role).toBe('Technician'); // Hardcoded
      expect(technician.skills).toEqual([]); // Empty array
    });
  });

  describe('getTechnicianByIdFromIFS', () => {
    it('should fetch a single technician by ID', async () => {
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce({
        value: [mockIFSResponse.value[0]],
      });

      const technician = await getTechnicianByIdFromIFS('TECH001');

      expect(technician).toEqual({
        id: 'TECH001',
        description: 'John Smith',
        ResourceSeq: 1001,
        role: 'Technician',
        skills: [],
      });

      // Verify filter was applied (URL encoded)
      const calledUrl = (ifsAuth.ifsGet as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('ResourceId');
      expect(calledUrl).toContain('TECH001');
    });

    it('should return undefined when technician not found', async () => {
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce({
        value: [],
      });

      const technician = await getTechnicianByIdFromIFS('NONEXISTENT');

      expect(technician).toBeUndefined();
    });
  });
});
