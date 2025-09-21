/**
 * Tests for the exclusionsWorkbench API client.
 * Ensures TypeScript interfaces and API calls work correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exclusionsWorkbenchApi } from '../exclusionsWorkbench';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper to check fetch was called with the right URL
function expectFetchCalledWith(expectedUrl: string) {
  expect(mockFetch).toHaveBeenCalled();
  const callArg = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
  const url = typeof callArg === 'string' ? callArg : callArg.url;
  expect(url).toBe(expectedUrl);
}

describe('exclusionsWorkbenchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStats', () => {
    it('returns properly typed stats data', async () => {
      const mockResponse = {
        companies_count: 1250,
        exclusions_count: 3500,
        sources_count: 12,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:30:00'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getStats();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/stats');
      expect(result).toEqual(mockResponse);
      expect(typeof result.companies_count).toBe('number');
      expect(typeof result.exclusions_count).toBe('number');
      expect(typeof result.sources_count).toBe('number');
      expect(typeof result.categories_count).toBe('number');
      expect(typeof result.last_ingestion).toBe('string');
    });

    it('handles API errors correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        clone: () => ({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      });

      await expect(exclusionsWorkbenchApi.getStats()).rejects.toThrow('HTTP error! status: 500');
    });

    it('handles network errors correctly', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(exclusionsWorkbenchApi.getStats()).rejects.toThrow('Network error');
    });
  });

  describe('getCategories', () => {
    it('returns properly typed categories data', async () => {
      const mockResponse = {
        categories: [
          { category: 'Human Rights Violations', count: 850 },
          { category: 'Environmental Harm', count: 650 },
          { category: 'Governance Failures', count: 450 },
          { category: 'Addictive Products', count: 200 }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getCategories();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/categories');
      expect(result).toEqual(mockResponse);
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories[0]).toHaveProperty('category');
      expect(result.categories[0]).toHaveProperty('count');
      expect(typeof result.categories[0].category).toBe('string');
      expect(typeof result.categories[0].count).toBe('number');
    });
  });

  describe('getSourceMappings', () => {
    it('returns properly typed source mappings data', async () => {
      const mockResponse = {
        mappings: [
          { source_key: 'bds_movement', source_name: 'Palestinian BDS National Committee', companies_count: 120 },
          { source_key: 'dont_buy_occupation', source_name: "Don't Buy Into Occupation Coalition", companies_count: 85 }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getSourceMappings();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/source-mappings');
      expect(result).toEqual(mockResponse);
      expect(Array.isArray(result.mappings)).toBe(true);
      expect(result.mappings[0]).toHaveProperty('source_key');
      expect(result.mappings[0]).toHaveProperty('source_name');
      expect(result.mappings[0]).toHaveProperty('companies_count');
    });
  });

  describe('getDataQuality', () => {
    it('returns properly typed data quality metrics', async () => {
      const mockResponse = {
        completeness_rate: 0.92,
        duplicate_count: 25,
        quality_score: 0.88,
        issues: [
          { type: 'missing_data', count: 15, severity: 'medium', description: 'Missing sector information' }
        ],
        duplicates: [
          { name1: 'Apple Inc', name2: 'Apple Inc.', similarity: 0.95 }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getDataQuality();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/data-quality');
      expect(result).toEqual(mockResponse);
      expect(typeof result.completeness_rate).toBe('number');
      expect(typeof result.duplicate_count).toBe('number');
      expect(typeof result.quality_score).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.duplicates)).toBe(true);
    });
  });

  describe('getSharadarCoverage', () => {
    it('returns properly typed Sharadar coverage data', async () => {
      const mockResponse = {
        total_exclusions: 3500,
        matched_in_sharadar: 2100,
        match_rate: 0.60,
        category_coverage: [
          { category: 'Human Rights Violations', total: 1200, matched: 720, rate: 0.60 }
        ],
        top_matches: [
          { company_name: 'Apple Inc', sharadar_ticker: 'AAPL', sector: 'Technology' }
        ],
        unmatched_companies: [
          { company_name: 'Small Private Corp', reason_category: 'Human Rights Violations' }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getSharadarCoverage();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/sharadar-coverage');
      expect(result).toEqual(mockResponse);
      expect(typeof result.total_exclusions).toBe('number');
      expect(typeof result.matched_in_sharadar).toBe('number');
      expect(typeof result.match_rate).toBe('number');
      expect(Array.isArray(result.category_coverage)).toBe(true);
      expect(Array.isArray(result.top_matches)).toBe(true);
      expect(Array.isArray(result.unmatched_companies)).toBe(true);
    });
  });

  describe('getIngestionLogs', () => {
    it('returns properly typed ingestion logs data', async () => {
      const mockResponse = {
        logs: [
          {
            source_key: 'bds_movement',
            status: 'success',
            companies_processed: 120,
            errors: 0,
            ingestion_time: '2025-01-15 09:30:00',
            message: 'Successfully processed 120 companies'
          },
          {
            source_key: 'dont_buy_occupation',
            status: 'error',
            companies_processed: 0,
            errors: 1,
            ingestion_time: '2025-01-15 09:25:00',
            message: 'Connection timeout to external API'
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getIngestionLogs();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/ingestion-logs');
      expect(result).toEqual(mockResponse);
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.logs[0]).toHaveProperty('source_key');
      expect(result.logs[0]).toHaveProperty('status');
      expect(result.logs[0]).toHaveProperty('companies_processed');
      expect(result.logs[0]).toHaveProperty('errors');
      expect(result.logs[0]).toHaveProperty('ingestion_time');
      expect(result.logs[0]).toHaveProperty('message');
    });

    it('handles optional limit parameter', async () => {
      const mockResponse = { logs: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      await exclusionsWorkbenchApi.getIngestionLogs(50);

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/ingestion-logs?limit=50');
    });

    it('handles no limit parameter', async () => {
      const mockResponse = { logs: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      await exclusionsWorkbenchApi.getIngestionLogs();

      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/ingestion-logs');
    });
  });

  describe('error handling', () => {
    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        clone: () => ({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
      });

      await expect(exclusionsWorkbenchApi.getStats()).rejects.toThrow('Invalid JSON');
    });

    it('handles 404 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        clone: () => ({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      });

      await expect(exclusionsWorkbenchApi.getStats()).rejects.toThrow('HTTP error! status: 404');
    });

    it('handles 403 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        clone: () => ({
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        })
      });

      await expect(exclusionsWorkbenchApi.getStats()).rejects.toThrow('HTTP error! status: 403');
    });
  });

  describe('TypeScript interface compliance', () => {
    it('ensures ExclusionsStats interface compliance', async () => {
      const mockResponse = {
        companies_count: 1000,
        exclusions_count: 2000,
        sources_count: 10,
        categories_count: 5,
        last_ingestion: '2025-01-15 10:00:00'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getStats();

      // TypeScript compiler ensures these properties exist and have correct types
      const stats: typeof result = result;
      expect(stats.companies_count).toBeDefined();
      expect(stats.exclusions_count).toBeDefined();
      expect(stats.sources_count).toBeDefined();
      expect(stats.categories_count).toBeDefined();
      expect(stats.last_ingestion).toBeDefined();
    });

    it('ensures SharadarCoverageResponse interface compliance', async () => {
      const mockResponse = {
        total_exclusions: 1000,
        matched_in_sharadar: 600,
        match_rate: 0.60,
        category_coverage: [],
        top_matches: [],
        unmatched_companies: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      const result = await exclusionsWorkbenchApi.getSharadarCoverage();

      // TypeScript compiler ensures interface compliance
      const coverage: typeof result = result;
      expect(coverage.total_exclusions).toBeDefined();
      expect(coverage.matched_in_sharadar).toBeDefined();
      expect(coverage.match_rate).toBeDefined();
      expect(Array.isArray(coverage.category_coverage)).toBe(true);
      expect(Array.isArray(coverage.top_matches)).toBe(true);
      expect(Array.isArray(coverage.unmatched_companies)).toBe(true);
    });
  });

  describe('request validation', () => {
    it('validates limit parameter constraints', async () => {
      const mockResponse = { logs: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        clone: () => ({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      });

      // Test with valid limit
      await exclusionsWorkbenchApi.getIngestionLogs(100);
      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/ingestion-logs?limit=100');

      // Test with zero limit
      await exclusionsWorkbenchApi.getIngestionLogs(0);
      expectFetchCalledWith('http://localhost:8000/api/exclusions/workbench/ingestion-logs?limit=0');
    });
  });
});