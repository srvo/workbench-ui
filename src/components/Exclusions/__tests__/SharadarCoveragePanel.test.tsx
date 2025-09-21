import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SharadarCoveragePanel from '../SharadarCoveragePanel';
import { exclusionsWorkbenchApi } from '../../../api/exclusionsWorkbench';

// Mock the API
vi.mock('../../../api/exclusionsWorkbench', () => ({
  exclusionsWorkbenchApi: {
    getSharadarCoverage: vi.fn()
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

// Helper to create properly structured mock data
const createMockCoverageData = (summaryOverrides = {}) => ({
  summary: {
    total_exclusions: 3500,
    total_sharadar: 10000,
    matched_exclusions: 2100,
    match_rate: 60.0,
    unmatched_exclusions: 1400,
    ...summaryOverrides
  },
  category_coverage: [],
  top_matches: [],
  unmatched_sample: [],
  unmatched_total: 1400
});

describe('SharadarCoveragePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(createMockCoverageData()), 100))
    );

    renderWithProviders(<SharadarCoveragePanel />);

    expect(screen.getByText('Analyzing Sharadar coverage...')).toBeInTheDocument();
  });

  it('displays coverage statistics correctly', async () => {
    const mockCoverageData = createMockCoverageData({
      total_exclusions: 3500,
      total_sharadar: 10000,
      matched_exclusions: 2100,
      match_rate: 60.0,
      unmatched_exclusions: 1400
    });
    mockCoverageData.category_coverage = [
      { category: 'Human Rights Violations', total: 1200, matched: 720, rate: 60.0 },
      { category: 'Environmental Harm', total: 800, matched: 560, rate: 70.0 }
    ];

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(mockCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('3,500')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
      expect(screen.getByText('2,100')).toBeInTheDocument();
      expect(screen.getByText('1,400')).toBeInTheDocument(); // Unmatched count
    });

    expect(screen.getByText('Total Exclusions')).toBeInTheDocument();
    expect(screen.getByText('Sharadar Companies')).toBeInTheDocument();
    expect(screen.getByText('Match Rate')).toBeInTheDocument();
    expect(screen.getByText('Unmatched')).toBeInTheDocument();
  });

  it('handles empty data gracefully', async () => {
    const emptyCoverageData = createMockCoverageData({
      total_exclusions: 0,
      total_sharadar: 10000,
      matched_exclusions: 0,
      match_rate: 0,
      unmatched_exclusions: 0
    });

    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockResolvedValue(emptyCoverageData);

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('Total Exclusions')).toBeInTheDocument();
      // Check for 0% match rate specifically
      const matchRateElement = screen.getByText('Match Rate');
      const parent = matchRateElement.closest('div')?.parentElement;
      expect(parent?.textContent).toContain('0%');
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(exclusionsWorkbenchApi.getSharadarCoverage).mockRejectedValue(
      new Error('Coverage API Error')
    );

    renderWithProviders(<SharadarCoveragePanel />);

    await waitFor(() => {
      expect(screen.getByText('Coverage API Error')).toBeInTheDocument();
    });
  });
});
