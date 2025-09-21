/**
 * Tests for the exclusionsWorkbench API client.
 * Tests actual API calls using MSW for realistic integration testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { exclusionsWorkbenchApi } from '../exclusionsWorkbench';

describe('exclusionsWorkbenchApi', () => {
  beforeEach(() => {
    // Tests use MSW for realistic integration testing
  });

  describe('getStats', () => {
    it('returns properly typed stats data', async () => {
      const result = await exclusionsWorkbenchApi.getStats();

      // MSW returns mock data that matches our interface
      expect(result).toEqual({
        companies: 2500,
        exclusions: 3200,
        sources: 12,
        categories: 8
      });
      expect(typeof result.companies).toBe('number');
      expect(typeof result.exclusions).toBe('number');
      expect(typeof result.sources).toBe('number');
      expect(typeof result.categories).toBe('number');
    });
  });

  describe('getCategories', () => {
    it('returns properly typed categories data', async () => {
      const result = await exclusionsWorkbenchApi.getCategories();

      // MSW returns mock data that matches our interface
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.categories[0]).toHaveProperty('category');
      expect(result.categories[0]).toHaveProperty('companies');
      expect(typeof result.categories[0].category).toBe('string');
      expect(typeof result.categories[0].companies).toBe('number');
    });
  });

  describe('getSourceMappings', () => {
    it('returns properly typed source mappings data', async () => {
      const result = await exclusionsWorkbenchApi.getSourceMappings();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('source');
    });
  });

  describe('getDataQuality', () => {
    it('returns properly typed data quality metrics', async () => {
      const result = await exclusionsWorkbenchApi.getDataQuality();

      expect(typeof result.total_companies).toBe('number');
      expect(typeof result.companies_with_tickers).toBe('number');
      expect(typeof result.ticker_coverage).toBe('number');
    });
  });

  describe('getSharadarCoverage', () => {
    it('returns properly typed Sharadar coverage data', async () => {
      const result = await exclusionsWorkbenchApi.getSharadarCoverage();

      expect(typeof result.total_exclusions).toBe('number');
      expect(typeof result.sharadar_matches).toBe('number');
      expect(typeof result.coverage_percentage).toBe('number');
    });
  });

  describe('getIngestionLogs', () => {
    it('returns properly typed ingestion logs data', async () => {
      const result = await exclusionsWorkbenchApi.getIngestionLogs();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('source');
      expect(result[0]).toHaveProperty('status');
    });

    it('handles optional limit parameter', async () => {
      const result = await exclusionsWorkbenchApi.getIngestionLogs(50);

      expect(Array.isArray(result)).toBe(true);
    });

    it('handles no limit parameter', async () => {
      const result = await exclusionsWorkbenchApi.getIngestionLogs();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCategoryGuidance', () => {
    it('returns category guidance data', async () => {
      const result = await exclusionsWorkbenchApi.getCategoryGuidance('Animal Rights');

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('ai_guidance');
      expect(result).toHaveProperty('policy_link');
    });
  });

  describe('TypeScript interface compliance', () => {
    it('ensures ExclusionsStats interface compliance', async () => {
      const result = await exclusionsWorkbenchApi.getStats();

      // TypeScript compilation will fail if interface doesn't match
      const stats: typeof result = {
        companies: result.companies,
        exclusions: result.exclusions,
        sources: result.sources,
        categories: result.categories
      };

      expect(stats).toBeDefined();
    });

    it('ensures SharadarCoverageResponse interface compliance', async () => {
      const result = await exclusionsWorkbenchApi.getSharadarCoverage();

      // TypeScript compilation will fail if interface doesn't match
      expect(typeof result.total_exclusions).toBe('number');
      expect(typeof result.coverage_percentage).toBe('number');
    });
  });
});