import { getCrewsFromIFS, getCrewMembershipsFromIFS, getCrewLeadersFromIFS } from '../ifs-crews';
import * as ifsAuth from '../ifs-auth';

// Mock the ifs-auth module
jest.mock('../ifs-auth', () => ({
  ifsGet: jest.fn(),
}));

describe('IFS Cloud Crews API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1) getCrewsFromIFS', () => {
    it('should fetch crews with correct parameters', async () => {
      const mockResponse = {
        value: [
          { ResourceSeq: 2001, ResourceId: 'CREW1', Description: 'Alpha Crew' },
          { ResourceSeq: 2002, ResourceId: 'CREW2', Description: 'Beta Crew' },
        ],
      };
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce(mockResponse);

      const crews = await getCrewsFromIFS();

      expect(ifsAuth.ifsGet).toHaveBeenCalledTimes(1);
      const calledUrl = (ifsAuth.ifsGet as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('ResourceCrewHandling.svc/ResourceSet');
      expect(calledUrl).toContain('$select=ResourceSeq,ResourceId,Description');
      expect(calledUrl).toContain('$filter=ResourceParentSeq');
      
      expect(crews).toEqual(mockResponse.value);
    });
  });

  describe('2) getCrewMembershipsFromIFS', () => {
    it('should fetch crew memberships for a specific ResourceSeq (e.g., 2589)', async () => {
      const resourceSeq = 2589;
      const mockResponse = {
        value: [
          { ResourceSeq: 1001, ResourceMemberSeq: 5001, ResourceId: 'TECH1', PeriodStart: '2024-01-01T00:00:00Z', PeriodEnd: '2024-12-31T23:59:59Z' },
        ],
      };
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce(mockResponse);

      const memberships = await getCrewMembershipsFromIFS(resourceSeq);

      expect(ifsAuth.ifsGet).toHaveBeenCalledTimes(1);
      const calledUrl = (ifsAuth.ifsGet as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain(`ResourceSet(ResourceSeq=${resourceSeq})/ResourceCrewMembersArray`);
      expect(calledUrl).toContain('$select=ResourceSeq,ResourceMemberSeq,ResourceId,PeriodStart,PeriodEnd');
      
      expect(memberships).toEqual(mockResponse.value);
    });
  });

  describe('3) getCrewLeadersFromIFS', () => {
    it('should fetch crew leaders for a specific ResourceSeq (e.g., 2589)', async () => {
      const resourceSeq = 2589;
      const mockResponse = {
        value: [
          { ResourceSeq: 1005, ResourceCrewLeaderSeq: 6001, ResourceId: 'LEADER1', ValidFrom: '2024-01-01T00:00:00Z', ValidTo: '2024-12-31T23:59:59Z' },
        ],
      };
      (ifsAuth.ifsGet as jest.Mock).mockResolvedValueOnce(mockResponse);

      const leaders = await getCrewLeadersFromIFS(resourceSeq);

      expect(ifsAuth.ifsGet).toHaveBeenCalledTimes(1);
      const calledUrl = (ifsAuth.ifsGet as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain(`ResourceCrewSet(ResourceSeq=${resourceSeq})/ResourceCrewLeadersArray`);
      expect(calledUrl).toContain('$select=ResourceSeq,ResourceCrewLeaderSeq,ResourceId,ValidFrom,ValidTo');
      
      expect(leaders).toEqual(mockResponse.value);
    });
  });
});
