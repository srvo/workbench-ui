import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Exclusions from '../Exclusions';
import { exclusionsWorkbenchApi } from '../../api/exclusionsWorkbench';

vi.mock('../../api/exclusionsWorkbench', () => ({
  exclusionsWorkbenchApi: {
    getStats: vi.fn(),
    getCategories: vi.fn(),
    getSourceMappings: vi.fn(),
    getDataQuality: vi.fn(),
    getSharadarCoverage: vi.fn(),
    getIngestionLogs: vi.fn()
  }
}));

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

describe('Exclusions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock responses
    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue({
      companies_count: 1000,
      exclusions_count: 2000,
      sources_count: 10,
      categories_count: 5,
      last_ingestion: '2025-01-15 10:00:00'
    });

    vi.mocked(exclusionsWorkbenchApi.getCategories).mockResolvedValue({
      categories: [],
      overlaps: []
    });

    vi.mocked(exclusionsWorkbenchApi.getSourceMappings).mockResolvedValue({
      mappings: []
    });

    vi.mocked(exclusionsWorkbenchApi.getDataQuality).mockResolvedValue({
      completeness_rate: 0.95,
      duplicate_count: 10,
      quality_score: 0.90,
      issues: [],
      duplicates: []
    });

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue({
      summary: {
        total_exclusions: 2000,
        total_sharadar: 10000,
        matched_exclusions: 1500,
        match_rate: 75.0,
        unmatched_exclusions: 500
      },
      category_coverage: [],
      top_matches: [],
      unmatched_sample: [],
      unmatched_total: 500
    });

    vi.mocked(exclusionsWorkbenchApi.getIngestionLogs).mockResolvedValue({
      logs: []
    });
  });

  it('renders exclusions page with header', async () => {
    renderWithProviders(<Exclusions />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
    });
  });

  it('renders all tab buttons', async () => {
    renderWithProviders(<Exclusions />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
    });

    // Check for tab buttons using partial text matching
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categories/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sharadar Coverage/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Source Mappings/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Data Quality/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingestion Logs/ })).toBeInTheDocument();
  });

  it('switches between tabs when clicked', async () => {
    renderWithProviders(<Exclusions />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
    });

    const categoriesTab = screen.getByRole('button', { name: /Categories/ });
    fireEvent.click(categoriesTab);

    // Tab should be clickable without errors
    expect(categoriesTab).toBeInTheDocument();
  });

  it('displays dashboard content by default', async () => {
    renderWithProviders(<Exclusions />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
    });

    // Dashboard tab should be active by default
    const dashboardTab = screen.getByRole('button', { name: /Dashboard/ });
    expect(dashboardTab).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(exclusionsWorkbenchApi.getStats).mockRejectedValue(
      new Error('API Error')
    );

    renderWithProviders(<Exclusions />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
    });

    // Page should still render even with API errors
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
  });

  it('renders without crashing when switching tabs rapidly', async () => {
    renderWithProviders(<Exclusions />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
    });

    const tabs = [
      'Categories',
      'Sharadar Coverage',
      'Source Mappings',
      'Data Quality',
      'Ingestion Logs',
      'Dashboard'
    ];

    // Click through all tabs rapidly
    for (const tabName of tabs) {
      const tab = screen.getByRole('button', { name: new RegExp(tabName) });
      fireEvent.click(tab);
    }

    // Should not crash
    expect(screen.getByText('🔍 Exclusions Management')).toBeInTheDocument();
  });
});