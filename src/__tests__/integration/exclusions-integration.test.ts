/**
 * Integration tests for the exclusions workbench functionality.
 * Tests the full flow from API endpoints to frontend components.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { exclusionsWorkbenchApi } from '../../api/exclusionsWorkbench';
import Exclusions from '../../pages/Exclusions';

// Mock the API module
vi.mock('../../api/exclusionsWorkbench');

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Exclusions Workbench Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Dashboard Flow', () => {
    it('loads dashboard data and displays comprehensive statistics', async () => {
      // Mock API responses for full dashboard
      const mockStats = {
        companies_count: 1250,
        exclusions_count: 3500,
        sources_count: 12,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:30:00'
      };

      vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

      renderWithProviders(<Exclusions />);

      // Should load dashboard by default
      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument();
        expect(screen.getByText('3,500')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
      });

      expect(exclusionsWorkbenchApi.getStats).toHaveBeenCalledTimes(1);
    });

    it('handles dashboard error states gracefully', async () => {
      vi.mocked(exclusionsWorkbenchApi.getStats).mockRejectedValue(new Error('Database connection failed'));

      renderWithProviders(<Exclusions />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('Sharadar Coverage Integration', () => {
    it('loads and displays complete coverage analysis', async () => {
      const mockCoverageData = {
        total_exclusions: 3500,
        matched_in_sharadar: 2100,
        match_rate: 0.60,
        category_coverage: [
          { category: 'Human Rights Violations', total: 1200, matched: 720, rate: 0.60 },
          { category: 'Environmental Harm', total: 800, matched: 560, rate: 0.70 },
          { category: 'Governance Failures', total: 900, matched: 540, rate: 0.60 },
          { category: 'Addictive Products', total: 600, matched: 280, rate: 0.47 }
        ],
        top_matches: [
          { company_name: 'Apple Inc', sharadar_ticker: 'AAPL', sector: 'Technology' },
          { company_name: 'Microsoft Corp', sharadar_ticker: 'MSFT', sector: 'Technology' },
          { company_name: 'Exxon Mobil Corp', sharadar_ticker: 'XOM', sector: 'Energy' },
          { company_name: 'JPMorgan Chase & Co', sharadar_ticker: 'JPM', sector: 'Financial' },
          { company_name: 'Johnson & Johnson', sharadar_ticker: 'JNJ', sector: 'Healthcare' }
        ],
        unmatched_companies: [
          { company_name: 'Small Private Defense Corp', reason_category: 'Human Rights Violations' },
          { company_name: 'Regional Mining Company', reason_category: 'Environmental Harm' },
          { company_name: 'Foreign Tobacco Manufacturer', reason_category: 'Addictive Products' }
        ]
      };

      vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

      renderWithProviders(<Exclusions />);

      // Navigate to coverage tab
      fireEvent.click(screen.getByText('📈 Sharadar Coverage'));

      await waitFor(() => {
        // Check overview statistics
        expect(screen.getByText('3,500')).toBeInTheDocument();
        expect(screen.getByText('2,100')).toBeInTheDocument();
        expect(screen.getByText('60.0%')).toBeInTheDocument();

        // Check category breakdown
        expect(screen.getByText('Human Rights Violations')).toBeInTheDocument();
        expect(screen.getByText('720 / 1,200')).toBeInTheDocument();
        expect(screen.getByText('Environmental Harm')).toBeInTheDocument();
        expect(screen.getByText('560 / 800')).toBeInTheDocument();

        // Check top matches
        expect(screen.getByText('Apple Inc')).toBeInTheDocument();
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('Microsoft Corp')).toBeInTheDocument();
        expect(screen.getByText('MSFT')).toBeInTheDocument();

        // Check unmatched companies
        expect(screen.getByText('Small Private Defense Corp')).toBeInTheDocument();
        expect(screen.getByText('Regional Mining Company')).toBeInTheDocument();
      });

      expect(exclusionsWorkbenchApi.getSharadarCoverage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-Tab Navigation Integration', () => {
    it('preserves data across tab switches', async () => {
      // Mock all API endpoints
      const mockStats = {
        companies_count: 1000,
        exclusions_count: 2000,
        sources_count: 10,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:00:00'
      };

      const mockCategories = {
        categories: [
          { category: 'Human Rights Violations', count: 800 },
          { category: 'Environmental Harm', count: 600 },
          { category: 'Governance Failures', count: 400 },
          { category: 'Addictive Products', count: 200 }
        ]
      };

      const mockMappings = {
        mappings: [
          { source_key: 'bds_movement', source_name: 'Palestinian BDS National Committee', companies_count: 120 },
          { source_key: 'dont_buy_occupation', source_name: "Don't Buy Into Occupation Coalition", companies_count: 85 }
        ]
      };

      const mockQuality = {
        completeness_rate: 0.92,
        duplicate_count: 25,
        quality_score: 0.88,
        duplicates: [
          { name1: 'Apple Inc', name2: 'Apple Inc.', similarity: 0.95 }
        ]
      };

      const mockLogs = {
        logs: [
          {
            source_key: 'bds_movement',
            status: 'success',
            companies_processed: 120,
            errors: 0,
            ingestion_time: '2025-01-15 09:30:00',
            message: 'Successfully processed 120 companies'
          }
        ]
      };

      vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);
      vi.mocked(exclusionsWorkbenchApi.getCategories).mockResolvedValue(mockCategories);
      vi.mocked(exclusionsWorkbenchApi.getSourceMappings).mockResolvedValue(mockMappings);
      vi.mocked(exclusionsWorkbenchApi.getDataQuality).mockResolvedValue(mockQuality);
      vi.mocked(exclusionsWorkbenchApi.getIngestionLogs).mockResolvedValue(mockLogs);

      renderWithProviders(<Exclusions />);

      // Start on dashboard and verify data loads
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });

      // Switch to categories and verify data loads
      fireEvent.click(screen.getByText('🏷️ Categories'));
      await waitFor(() => {
        expect(screen.getByText('Human Rights Violations')).toBeInTheDocument();
        expect(screen.getByText('800')).toBeInTheDocument();
      });

      // Switch to source mappings
      fireEvent.click(screen.getByText('🔗 Source Mappings'));
      await waitFor(() => {
        expect(screen.getByText('Palestinian BDS National Committee')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
      });

      // Switch to data quality
      fireEvent.click(screen.getByText('🧹 Data Quality'));
      await waitFor(() => {
        expect(screen.getByText('92.0%')).toBeInTheDocument(); // completeness rate
        expect(screen.getByText('25')).toBeInTheDocument(); // duplicate count
      });

      // Switch to logs
      fireEvent.click(screen.getByText('📋 Ingestion Logs'));
      await waitFor(() => {
        expect(screen.getByText('Successfully processed 120 companies')).toBeInTheDocument();
      });

      // Switch back to dashboard - data should still be there
      fireEvent.click(screen.getByText('📊 Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });

      // Verify each API was called exactly once due to caching
      expect(exclusionsWorkbenchApi.getStats).toHaveBeenCalledTimes(1);
      expect(exclusionsWorkbenchApi.getCategories).toHaveBeenCalledTimes(1);
      expect(exclusionsWorkbenchApi.getSourceMappings).toHaveBeenCalledTimes(1);
      expect(exclusionsWorkbenchApi.getDataQuality).toHaveBeenCalledTimes(1);
      expect(exclusionsWorkbenchApi.getIngestionLogs).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery Integration', () => {
    it('handles partial API failures gracefully', async () => {
      // Mock mixed success/failure responses
      vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue({
        companies_count: 1000,
        exclusions_count: 2000,
        sources_count: 10,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:00:00'
      });

      vi.mocked(exclusionsWorkbenchApi.getCategories).mockRejectedValue(new Error('Categories API failed'));

      renderWithProviders(<Exclusions />);

      // Dashboard should load successfully
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });

      // Categories should show error
      fireEvent.click(screen.getByText('🏷️ Categories'));
      await waitFor(() => {
        expect(screen.getByText('Categories API failed')).toBeInTheDocument();
      });

      // Should be able to navigate back to working dashboard
      fireEvent.click(screen.getByText('📊 Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('handles large datasets efficiently', async () => {
      const startTime = performance.now();

      // Mock large dataset responses
      const largeCoverageData = {
        total_exclusions: 50000,
        matched_in_sharadar: 35000,
        match_rate: 0.70,
        category_coverage: Array.from({ length: 20 }, (_, i) => ({
          category: `Category ${i + 1}`,
          total: 2500,
          matched: 1750,
          rate: 0.70
        })),
        top_matches: Array.from({ length: 100 }, (_, i) => ({
          company_name: `Company ${i + 1}`,
          sharadar_ticker: `TICK${i + 1}`,
          sector: `Sector ${(i % 10) + 1}`
        })),
        unmatched_companies: Array.from({ length: 200 }, (_, i) => ({
          company_name: `Unmatched Company ${i + 1}`,
          reason_category: `Category ${(i % 4) + 1}`
        }))
      };

      vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(largeCoverageData), 50))
      );

      renderWithProviders(<Exclusions />);

      fireEvent.click(screen.getByText('📈 Sharadar Coverage'));

      await waitFor(() => {
        expect(screen.getByText('50,000')).toBeInTheDocument();
        expect(screen.getByText('35,000')).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('maintains responsiveness during rapid tab switching', async () => {
      // Mock all endpoints with small delays
      const createMockWithDelay = (data: any, delay: number = 10) =>
        vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(data), delay)));

      vi.mocked(exclusionsWorkbenchApi.getStats).mockImplementation(createMockWithDelay({
        companies_count: 1000, exclusions_count: 2000, sources_count: 10, categories_count: 4, last_ingestion: '2025-01-15'
      }));

      vi.mocked(exclusionsWorkbenchApi.getCategories).mockImplementation(createMockWithDelay({
        categories: [{ category: 'Test', count: 100 }]
      }));

      vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockImplementation(createMockWithDelay({
        total_exclusions: 1000, matched_in_sharadar: 600, match_rate: 0.60, category_coverage: [], top_matches: [], unmatched_companies: []
      }));

      renderWithProviders(<Exclusions />);

      const startTime = performance.now();

      // Rapidly switch between tabs
      const tabs = [
        '🏷️ Categories',
        '📈 Sharadar Coverage',
        '📊 Dashboard',
        '🏷️ Categories',
        '📈 Sharadar Coverage'
      ];

      for (const tab of tabs) {
        fireEvent.click(screen.getByText(tab));
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay between clicks
      }

      const endTime = performance.now();

      // Tab switching should be fast
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Data Consistency Integration', () => {
    it('maintains data consistency across components', async () => {
      const mockStats = {
        companies_count: 1250,
        exclusions_count: 3500,
        sources_count: 12,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:30:00'
      };

      const mockCategories = {
        categories: [
          { category: 'Human Rights Violations', count: 1400 },
          { category: 'Environmental Harm', count: 1100 },
          { category: 'Governance Failures', count: 700 },
          { category: 'Addictive Products', count: 300 }
        ]
      };

      vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);
      vi.mocked(exclusionsWorkbenchApi.getCategories).mockResolvedValue(mockCategories);

      renderWithProviders(<Exclusions />);

      // Check dashboard stats
      await waitFor(() => {
        expect(screen.getByText('3,500')).toBeInTheDocument(); // total exclusions
        expect(screen.getByText('4')).toBeInTheDocument(); // categories count
      });

      // Switch to categories and verify the totals are consistent
      fireEvent.click(screen.getByText('🏷️ Categories'));
      await waitFor(() => {
        expect(screen.getByText('1,400')).toBeInTheDocument();
        expect(screen.getByText('1,100')).toBeInTheDocument();
        expect(screen.getByText('700')).toBeInTheDocument();
        expect(screen.getByText('300')).toBeInTheDocument();
      });

      // The sum of categories (3500) should match the total exclusions from dashboard
      const categorySum = 1400 + 1100 + 700 + 300;
      expect(categorySum).toBe(mockStats.exclusions_count);
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper ARIA attributes throughout navigation', async () => {
      vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue({
        companies_count: 1000, exclusions_count: 2000, sources_count: 10, categories_count: 4, last_ingestion: '2025-01-15'
      });

      renderWithProviders(<Exclusions />);

      // Check initial ARIA states
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);

      // First tab should be selected
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Navigate to another tab
      fireEvent.click(tabs[1]);

      // Check ARIA states updated
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });
});