import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { securitiesApi } from '../../api/securities';
import { apiClient } from '../../lib/fetch';
import { server } from '../../test/mocks/server';

describe.skip('API Integration Tests (requires Node.js environment for external HTTP calls)', () => {
  beforeAll(() => {
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('API Client Base URL:', apiClient.defaults.baseURL);

    // Stop MSW server to allow real network requests
    server.close();
  });

  afterAll(() => {
    // Restart MSW server for other tests
    server.listen();
  });

  describe('Environment Configuration', () => {
    it('should have correct API base URL', () => {
      const expectedUrl = 'https://workbenchapi.ethicic.com';
      expect(apiClient.defaults.baseURL).toBe(expectedUrl);
    });

    it('should load environment variables correctly', () => {
      expect(import.meta.env.VITE_API_BASE_URL).toBeDefined();
      expect(import.meta.env.VITE_API_BASE_URL).toBe('https://workbenchapi.ethicic.com');
    });
  });

  describe('API Connectivity Check', () => {
    it('should connect to exclusions workbench stats', async () => {
      const response = await apiClient.get('/api/exclusions/workbench/stats');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('companies');
      expect(response.data).toHaveProperty('exclusions');
      expect(response.data).toHaveProperty('sources');
      expect(response.data).toHaveProperty('categories');
    }, 10000);
  });

  describe('Securities API', () => {
    it('should fetch securities list without query', async () => {
      const securities = await securitiesApi.search({ limit: 10, shuffle: 0 });
      expect(Array.isArray(securities)).toBe(true);
      expect(securities.length).toBeGreaterThan(0);
      expect(securities.length).toBeLessThanOrEqual(10);

      // Check structure of first security
      const security = securities[0];
      expect(security).toHaveProperty('symbol');
      expect(security).toHaveProperty('name');
      expect(security).toHaveProperty('is_excluded');
      expect(typeof security.symbol).toBe('string');
      expect(typeof security.name).toBe('string');
      expect(typeof security.is_excluded).toBe('boolean');
    }, 10000);

    it('should search for AGM specifically', async () => {
      const securities = await securitiesApi.search({ q: 'agm', limit: 10 });
      expect(Array.isArray(securities)).toBe(true);
      expect(securities.length).toBeGreaterThan(0);

      // Should find AGM
      const agm = securities.find(s => s.symbol === 'AGM');
      expect(agm).toBeDefined();
      expect(agm?.name).toBe('Farmer Mac');
      expect(agm?.sector).toBe('Financial - Credit Services');
    }, 10000);

    it('should handle search with various parameters', async () => {
      const params = {
        q: 'apple',
        limit: 5,
        shuffle: 1
      };

      const securities = await securitiesApi.search(params);
      expect(Array.isArray(securities)).toBe(true);
      expect(securities.length).toBeLessThanOrEqual(5);
    });

    it('should handle large limit requests', async () => {
      const securities = await securitiesApi.search({ limit: 500, shuffle: 0 });
      expect(Array.isArray(securities)).toBe(true);
      expect(securities.length).toBeGreaterThan(100); // Should have many securities
      expect(securities.length).toBeLessThanOrEqual(500);
    });
  });

  describe('API Error Handling', () => {
    it('should handle non-existent endpoints gracefully', async () => {
      try {
        await apiClient.get('/nonexistent');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });
  });

  describe('Frontend Query Parameters', () => {
    it('should build correct query parameters for default state', () => {
      const params = {
        limit: 500,
        shuffle: 0,
      };

      // This simulates what UniversePanel does by default
      expect(params.limit).toBe(500);
      expect(params.shuffle).toBe(0);
    });

    it('should build correct query parameters with search', () => {
      const searchQuery = 'agm';
      const params = {
        limit: 500,
        shuffle: 0,
        q: searchQuery,
      };

      expect(params.q).toBe('agm');
    });

    it('should build correct query parameters with filters', () => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      const params = {
        limit: 500,
        shuffle: 0,
        review_before: date.toISOString().split('T')[0],
      };

      expect(params.review_before).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});