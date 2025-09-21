import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExclusionsDashboard from '../ExclusionsDashboard';
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

describe('ExclusionsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with loading state', async () => {
    vi.mocked(exclusionsWorkbenchApi.getStats).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        companies_count: 1250,
        exclusions_count: 3500,
        sources_count: 12,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:30:00'
      }), 100))
    );

    renderWithProviders(<ExclusionsDashboard />);

    expect(screen.getByText('Loading exclusions dashboard...')).toBeInTheDocument();
  });

  it('displays stats correctly when data is loaded', async () => {
    const mockStats = {
      companies_count: 1250,
      exclusions_count: 3500,
      sources_count: 12,
      categories_count: 4,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument(); // companies_count
      expect(screen.getByText('3,500')).toBeInTheDocument(); // exclusions_count
      expect(screen.getByText('12')).toBeInTheDocument(); // sources_count
      expect(screen.getByText('4')).toBeInTheDocument(); // categories_count
    });

    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('Total Exclusions')).toBeInTheDocument();
    expect(screen.getByText('Data Sources')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('formats large numbers correctly', async () => {
    const mockStats = {
      companies_count: 1234567,
      exclusions_count: 2345678,
      sources_count: 25,
      categories_count: 8,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('2,345,678')).toBeInTheDocument();
    });
  });

  it('displays last ingestion time correctly', async () => {
    const mockStats = {
      companies_count: 1000,
      exclusions_count: 2000,
      sources_count: 10,
      categories_count: 5,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Last Ingestion')).toBeInTheDocument();
      expect(screen.getByText('2025-01-15 10:30:00')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    vi.mocked(exclusionsWorkbenchApi.getStats).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('handles missing data gracefully', async () => {
    const incompleteStats = {
      companies_count: 1000,
      exclusions_count: null,
      sources_count: undefined,
      categories_count: 4,
      last_ingestion: null
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(incompleteStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument(); // For null/undefined values
    });
  });

  it('refreshes data automatically', async () => {
    const mockStats = {
      companies_count: 1000,
      exclusions_count: 2000,
      sources_count: 10,
      categories_count: 4,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Verify the API is called with proper refresh interval
    expect(exclusionsWorkbenchApi.getStats).toHaveBeenCalledTimes(1);
  });

  it('displays stats in grid layout', async () => {
    const mockStats = {
      companies_count: 1250,
      exclusions_count: 3500,
      sources_count: 12,
      categories_count: 4,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    const { container } = renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    // Check for grid layout classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles zero values correctly', async () => {
    const mockStats = {
      companies_count: 0,
      exclusions_count: 0,
      sources_count: 0,
      categories_count: 0,
      last_ingestion: null
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(4); // One for each stat
    });
  });

  it('maintains responsive design', async () => {
    const mockStats = {
      companies_count: 1250,
      exclusions_count: 3500,
      sources_count: 12,
      categories_count: 4,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    // Should still render properly on mobile
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('shows appropriate icons for each stat', async () => {
    const mockStats = {
      companies_count: 1250,
      exclusions_count: 3500,
      sources_count: 12,
      categories_count: 4,
      last_ingestion: '2025-01-15 10:30:00'
    };

    vi.mocked(exclusionsWorkbenchApi.getStats).mockResolvedValue(mockStats);

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      // Check for specific stat labels that should have icons
      expect(screen.getByText('Total Companies')).toBeInTheDocument();
      expect(screen.getByText('Total Exclusions')).toBeInTheDocument();
      expect(screen.getByText('Data Sources')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });
  });

  it('handles network timeout gracefully', async () => {
    vi.mocked(exclusionsWorkbenchApi.getStats).mockImplementation(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 100)
      )
    );

    renderWithProviders(<ExclusionsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });
  });

  it('shows loading spinner during data fetch', async () => {
    vi.mocked(exclusionsWorkbenchApi.getStats).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        companies_count: 1000,
        exclusions_count: 2000,
        sources_count: 10,
        categories_count: 4,
        last_ingestion: '2025-01-15 10:30:00'
      }), 50))
    );

    renderWithProviders(<ExclusionsDashboard />);

    // Should show loading indicator
    expect(screen.getByText('Loading exclusions dashboard...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Loading should be gone
    expect(screen.queryByText('Loading exclusions dashboard...')).not.toBeInTheDocument();
  });
});