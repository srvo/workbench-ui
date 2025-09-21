import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exclusionsApi } from '../exclusions';
import { fetcher } from '../../lib/fetch';

// Mock the fetcher
vi.mock('../../lib/fetch', () => ({
  fetcher: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockFetcher = fetcher as any;

describe('exclusionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExclusions', () => {
    it('should fetch exclusions without filters', async () => {
      const mockExclusions = [
        {
          id: 1,
          symbol: 'AAPL',
          category_name: 'ESG Concerns',
          reason: 'Test reason',
          excluded_at: '2023-01-01',
          excluded_by: 'test_user',
          is_active: 1,
          source: 'manual',
        },
      ];

      mockFetcher.get.mockResolvedValue(mockExclusions);

      const result = await exclusionsApi.getExclusions();

      expect(mockFetcher.get).toHaveBeenCalledWith('/api/exclusions');
      expect(result).toEqual(mockExclusions);
    });

    it('should fetch exclusions with filters', async () => {
      const mockExclusions = [
        {
          id: 1,
          symbol: 'AAPL',
          category_name: 'ESG Concerns',
          reason: 'Test reason',
          excluded_at: '2023-01-01',
          excluded_by: 'test_user',
          is_active: 1,
          source: 'manual',
        },
      ];

      mockFetcher.get.mockResolvedValue(mockExclusions);

      const filters = {
        symbol: 'AAPL',
        category: 'ESG',
        is_active: true,
        limit: 10,
        offset: 0,
      };

      const result = await exclusionsApi.getExclusions(filters);

      expect(mockFetcher.get).toHaveBeenCalledWith(
        '/api/exclusions?symbol=AAPL&category=ESG&is_active=true&limit=10'
      );
      expect(result).toEqual(mockExclusions);
    });

    it('should handle filters with undefined values', async () => {
      const mockExclusions = [];
      mockFetcher.get.mockResolvedValue(mockExclusions);

      const filters = {
        symbol: undefined,
        category: 'ESG',
        is_active: undefined,
        limit: undefined,
        offset: undefined,
      };

      const result = await exclusionsApi.getExclusions(filters);

      expect(mockFetcher.get).toHaveBeenCalledWith('/api/exclusions?category=ESG');
      expect(result).toEqual(mockExclusions);
    });
  });

  describe('createExclusion', () => {
    it('should create a new exclusion', async () => {
      const newExclusion = {
        symbol: 'TSLA',
        reason: 'Environmental concerns',
        category_id: 1,
        source: 'manual',
      };

      const mockResponse = {
        id: 2,
        ...newExclusion,
        excluded_at: '2023-01-01',
        excluded_by: 'test_user',
        is_active: 1,
      };

      mockFetcher.post.mockResolvedValue(mockResponse);

      const result = await exclusionsApi.createExclusion(newExclusion);

      expect(mockFetcher.post).toHaveBeenCalledWith('/api/exclusions', newExclusion);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteExclusion', () => {
    it('should delete an exclusion', async () => {
      mockFetcher.delete.mockResolvedValue(undefined);

      await exclusionsApi.deleteExclusion(1);

      expect(mockFetcher.delete).toHaveBeenCalledWith('/api/exclusions/1');
    });
  });

  describe('reviewExclusion', () => {
    it('should review an exclusion with approval', async () => {
      const mockResponse = {
        id: 1,
        symbol: 'AAPL',
        reviewed_at: '2023-01-01',
        reviewed_by: 'reviewer',
      };

      mockFetcher.post.mockResolvedValue(mockResponse);

      const result = await exclusionsApi.reviewExclusion(1, 'approve', 'Looks good');

      expect(mockFetcher.post).toHaveBeenCalledWith('/api/exclusions/1/review', {
        decision: 'approve',
        notes: 'Looks good',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should review an exclusion with rejection', async () => {
      const mockResponse = {
        id: 1,
        symbol: 'AAPL',
        reviewed_at: '2023-01-01',
        reviewed_by: 'reviewer',
      };

      mockFetcher.post.mockResolvedValue(mockResponse);

      const result = await exclusionsApi.reviewExclusion(1, 'reject');

      expect(mockFetcher.post).toHaveBeenCalledWith('/api/exclusions/1/review', {
        decision: 'reject',
        notes: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCategories', () => {
    it('should fetch exclusion categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'ESG Concerns',
          color: '#FF6B6B',
          priority: 100,
          description: 'Environmental, Social, Governance issues',
        },
        {
          id: 2,
          name: 'Tobacco',
          color: '#FFA500',
          priority: 90,
          description: 'Tobacco companies',
        },
      ];

      mockFetcher.get.mockResolvedValue(mockCategories);

      const result = await exclusionsApi.getCategories();

      expect(mockFetcher.get).toHaveBeenCalledWith('/api/exclusions/categories');
      expect(result).toEqual(mockCategories);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'Weapons',
        color: '#808080',
        priority: 95,
        description: 'Weapons manufacturing',
      };

      const mockResponse = {
        id: 3,
        ...newCategory,
      };

      mockFetcher.post.mockResolvedValue(mockResponse);

      const result = await exclusionsApi.createCategory(newCategory);

      expect(mockFetcher.post).toHaveBeenCalledWith('/api/exclusions/categories', newCategory);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getExclusionHistory', () => {
    it('should fetch exclusion history', async () => {
      const mockHistory = [
        {
          id: 1,
          exclusion_id: 1,
          action: 'created',
          timestamp: '2023-01-01',
          user: 'test_user',
        },
        {
          id: 2,
          exclusion_id: 1,
          action: 'reviewed',
          timestamp: '2023-01-02',
          user: 'reviewer',
        },
      ];

      mockFetcher.get.mockResolvedValue(mockHistory);

      const result = await exclusionsApi.getExclusionHistory(1);

      expect(mockFetcher.get).toHaveBeenCalledWith('/api/exclusions/history/1');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('bulkCreateExclusions', () => {
    it('should bulk create exclusions', async () => {
      const exclusions = [
        { symbol: 'AAPL', reason: 'Reason 1', source: 'bulk' },
        { symbol: 'MSFT', reason: 'Reason 2', source: 'bulk' },
      ];

      const mockResponse = {
        created: 2,
        errors: [],
      };

      mockFetcher.post.mockResolvedValue(mockResponse);

      const result = await exclusionsApi.bulkCreateExclusions(exclusions);

      expect(mockFetcher.post).toHaveBeenCalledWith('/api/exclusions/bulk', { exclusions });
      expect(result).toEqual(mockResponse);
    });

    it('should handle bulk creation with errors', async () => {
      const exclusions = [
        { symbol: 'AAPL', reason: 'Reason 1', source: 'bulk' },
        { symbol: '', reason: 'Invalid symbol', source: 'bulk' },
      ];

      const mockResponse = {
        created: 1,
        errors: [
          { row: 2, error: 'Symbol cannot be empty' },
        ],
      };

      mockFetcher.post.mockResolvedValue(mockResponse);

      const result = await exclusionsApi.bulkCreateExclusions(exclusions);

      expect(mockFetcher.post).toHaveBeenCalledWith('/api/exclusions/bulk', { exclusions });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('exportExclusions', () => {
    it('should export exclusions as CSV', async () => {
      const mockBlob = new Blob(['symbol,reason\nAAPL,Test'], { type: 'text/csv' });

      // Mock fetch for export
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const result = await exclusionsApi.exportExclusions('csv');

      expect(global.fetch).toHaveBeenCalledWith('/api/exclusions/export?format=csv');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export exclusions with filters', async () => {
      const mockBlob = new Blob(['{"exclusions": []}'], { type: 'application/json' });

      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const filters = { category: 'ESG', is_active: true };

      const result = await exclusionsApi.exportExclusions('json', filters);

      expect(global.fetch).toHaveBeenCalledWith('/api/exclusions/export?format=json&category=ESG&is_active=true');
      expect(result).toBeInstanceOf(Blob);
    });
  });
});