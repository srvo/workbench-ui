import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SharadarCoveragePanel from '../SharadarCoveragePanel';
import { exclusionsWorkbenchApi } from '../../../api/exclusionsWorkbench';

vi.mock('../../../api/exclusionsWorkbench');

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
      {component}
    </QueryClientProvider>
  );
};

describe('SharadarCoveragePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        total_exclusions: 3500,
        matched_in_sharadar: 2100,
        match_rate: 0.60,
        category_coverage: [],
        top_matches: [],
        unmatched_companies: []
      }), 100))
    );

    renderWithProviders(<SharadarCoveragePanel />);

    expect(screen.getByText('Loading Sharadar coverage analysis...')).toBeInTheDocument();
  });

  it('displays coverage statistics correctly', async () => {
    const mockCoverageData = {
      total_exclusions: 3500,
      matched_in_sharadar: 2100,
      match_rate: 0.60,
      category_coverage: [
        { category: 'Human Rights Violations', total: 1200, matched: 720, rate: 0.60 },
        { category: 'Environmental Harm', total: 800, matched: 560, rate: 0.70 }
      ],
      top_matches: [
        { company_name: 'Apple Inc', sharadar_ticker: 'AAPL', sector: 'Technology' },
        { company_name: 'Microsoft Corp', sharadar_ticker: 'MSFT', sector: 'Technology' }
      ],
      unmatched_companies: [
        { company_name: 'Small Private Corp', reason_category: 'Human Rights Violations' },
        { company_name: 'Foreign Company Ltd', reason_category: 'Environmental Harm' }
      ]
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('3,500')).toBeInTheDocument(); // total_exclusions
      expect(screen.getByText('2,100')).toBeInTheDocument(); // matched_in_sharadar
      expect(screen.getByText('60.0%')).toBeInTheDocument(); // match_rate
    });

    expect(screen.getByText('Total Exclusions')).toBeInTheDocument();
    expect(screen.getByText('Matched in Sharadar')).toBeInTheDocument();
    expect(screen.getByText('Coverage Rate')).toBeInTheDocument();
  });

  it('displays category coverage breakdown', async () => {
    const mockCoverageData = {
      total_exclusions: 2000,
      matched_in_sharadar: 1400,
      match_rate: 0.70,
      category_coverage: [
        { category: 'Human Rights Violations', total: 1200, matched: 840, rate: 0.70 },
        { category: 'Environmental Harm', total: 800, matched: 560, rate: 0.70 }
      ],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('Coverage by Category')).toBeInTheDocument();
      expect(screen.getByText('Human Rights Violations')).toBeInTheDocument();
      expect(screen.getByText('Environmental Harm')).toBeInTheDocument();
      expect(screen.getByText('840 / 1,200')).toBeInTheDocument();
      expect(screen.getByText('560 / 800')).toBeInTheDocument();
    });
  });

  it('displays top matches table', async () => {
    const mockCoverageData = {
      total_exclusions: 1000,
      matched_in_sharadar: 600,
      match_rate: 0.60,
      category_coverage: [],
      top_matches: [
        { company_name: 'Apple Inc', sharadar_ticker: 'AAPL', sector: 'Technology' },
        { company_name: 'Microsoft Corp', sharadar_ticker: 'MSFT', sector: 'Technology' },
        { company_name: 'Exxon Mobil Corp', sharadar_ticker: 'XOM', sector: 'Energy' }
      ],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('Top Matched Companies')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corp')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  it('displays unmatched companies section', async () => {
    const mockCoverageData = {
      total_exclusions: 1000,
      matched_in_sharadar: 800,
      match_rate: 0.80,
      category_coverage: [],
      top_matches: [],
      unmatched_companies: [
        { company_name: 'Small Private Corp', reason_category: 'Human Rights Violations' },
        { company_name: 'Foreign Company Ltd', reason_category: 'Environmental Harm' },
        { company_name: 'Unlisted Startup', reason_category: 'Governance Failures' }
      ]
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('Unmatched Companies')).toBeInTheDocument();
      expect(screen.getByText('Small Private Corp')).toBeInTheDocument();
      expect(screen.getByText('Foreign Company Ltd')).toBeInTheDocument();
      expect(screen.getByText('Unlisted Startup')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockRejectedValue(new Error('Coverage API Error'));

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Sharadar Coverage')).toBeInTheDocument();
      expect(screen.getByText('Coverage API Error')).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    const emptyCoverageData = {
      total_exclusions: 0,
      matched_in_sharadar: 0,
      match_rate: 0,
      category_coverage: [],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(emptyCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    expect(screen.getByText('No category coverage data available')).toBeInTheDocument();
    expect(screen.getByText('No matched companies to display')).toBeInTheDocument();
    expect(screen.getByText('No unmatched companies')).toBeInTheDocument();
  });

  it('formats percentages correctly', async () => {
    const mockCoverageData = {
      total_exclusions: 3333,
      matched_in_sharadar: 2222,
      match_rate: 0.6666,
      category_coverage: [
        { category: 'Test Category', total: 333, matched: 222, rate: 0.6666 }
      ],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('66.7%')).toBeInTheDocument(); // Should round to 1 decimal place
    });
  });

  it('displays progress bars for category coverage', async () => {
    const mockCoverageData = {
      total_exclusions: 1000,
      matched_in_sharadar: 700,
      match_rate: 0.70,
      category_coverage: [
        { category: 'Human Rights Violations', total: 600, matched: 480, rate: 0.80 },
        { category: 'Environmental Harm', total: 400, matched: 220, rate: 0.55 }
      ],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    const { container } = renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('55.0%')).toBeInTheDocument();
    });

    // Check for progress bar elements
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles large numbers with proper formatting', async () => {
    const mockCoverageData = {
      total_exclusions: 1234567,
      matched_in_sharadar: 987654,
      match_rate: 0.80,
      category_coverage: [
        { category: 'Large Category', total: 500000, matched: 400000, rate: 0.80 }
      ],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('987,654')).toBeInTheDocument();
      expect(screen.getByText('400,000 / 500,000')).toBeInTheDocument();
    });
  });

  it('limits displayed items appropriately', async () => {
    const mockCoverageData = {
      total_exclusions: 1000,
      matched_in_sharadar: 800,
      match_rate: 0.80,
      category_coverage: [],
      top_matches: Array.from({ length: 50 }, (_, i) => ({
        company_name: `Company ${i + 1}`,
        sharadar_ticker: `TICK${i + 1}`,
        sector: `Sector ${i + 1}`
      })),
      unmatched_companies: Array.from({ length: 100 }, (_, i) => ({
        company_name: `Unmatched Company ${i + 1}`,
        reason_category: 'Test Category'
      }))
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      // Should limit display to reasonable number (e.g., first 10)
      expect(screen.getByText('Company 1')).toBeInTheDocument();
      expect(screen.getByText('Company 10')).toBeInTheDocument();

      // Should show indication of more items
      expect(screen.getByText(/\.\.\. and \d+ more/)).toBeInTheDocument();
    });
  });

  it('refreshes data automatically', async () => {
    const mockCoverageData = {
      total_exclusions: 1000,
      matched_in_sharadar: 600,
      match_rate: 0.60,
      category_coverage: [],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Verify the API is called
    expect(exclusionsWorkbenchApi.getSharadarCoverage).toHaveBeenCalledTimes(1);
  });

  it('maintains responsive layout', async () => {
    const mockCoverageData = {
      total_exclusions: 1000,
      matched_in_sharadar: 600,
      match_rate: 0.60,
      category_coverage: [],
      top_matches: [],
      unmatched_companies: []
    };

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Should maintain grid layout on mobile
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });
});