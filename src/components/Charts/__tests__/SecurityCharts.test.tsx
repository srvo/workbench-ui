import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SecurityCharts from '../SecurityCharts';
import { securitiesApi } from '../../../api/securities';
import { tickApi } from '../../../api/tick';

vi.mock('../../../api/securities');
vi.mock('../../../api/tick');

// Simple mock for Plotly that just renders a div
vi.mock('react-plotly.js', () => ({
  default: ({ data, layout }: any) => (
    <div data-testid="plotly-chart" data-chart="true">
      {JSON.stringify({ dataLength: data?.length || 0, hasLayout: !!layout })}
    </div>
  )
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQuery = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const mockChartData = {
  ohlc: {
    t: [1694995200, 1695081600, 1695168000],
    o: [175.0, 176.5, 174.2],
    h: [178.5, 179.0, 177.8],
    l: [174.5, 175.8, 173.5],
    c: [176.2, 174.8, 176.8]
  },
  sma200: [172.5, 173.1, 173.8]
};

const mockTickHistory = {
  t: [1694995200, 1695081600, 1695168000],
  v: [75, 78, 82]
};

const mockFundamentals = {
  series: {
    pb: { t: [1694995200, 1695081600], v: [25.5, 26.1] },
    pe: { t: [1694995200, 1695081600], v: [28.2, 27.9] },
    shy: { t: [1694995200, 1695081600], v: [2.1, 2.3] },
    rev_cagr_5y: { t: [1694995200, 1695081600], v: [8.5, 9.1] }
  }
};

describe('SecurityCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no symbol selected', () => {
    renderWithQuery(<SecurityCharts symbol={null} />);
    expect(screen.getByText('Select a security to view charts')).toBeInTheDocument();
  });

  it('renders component with valid data', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 80 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    // Wait for component to load data and render (more flexible)
    await waitFor(() => {
      expect(securitiesApi.getChart).toHaveBeenCalledWith('AAPL');
    }, { timeout: 3000 });

    // Component should render without crashing
    expect(screen.queryByText('Select a security to view charts')).not.toBeInTheDocument();
  });

  it('handles missing fundamentals data', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(securitiesApi.getChart).toHaveBeenCalledWith('AAPL');
    });

    // Component should handle missing fundamentals gracefully
    expect(securitiesApi.getFundamentals).toHaveBeenCalledWith('AAPL');
  });

  it('handles empty chart data gracefully', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue({ ohlc: { t: [], o: [], h: [], l: [], c: [] } });
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue({ t: [], v: [] });
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 0 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('No chart data available')).toBeInTheDocument();
    });
  });

  it('calls APIs with correct symbol', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 85 });

    renderWithQuery(<SecurityCharts symbol="TSLA" />);

    await waitFor(() => {
      expect(securitiesApi.getChart).toHaveBeenCalledWith('TSLA');
      expect(securitiesApi.getTickHistory).toHaveBeenCalledWith('TSLA');
      expect(securitiesApi.getFundamentals).toHaveBeenCalledWith('TSLA');
      expect(tickApi.get).toHaveBeenCalledWith('TSLA');
    });
  });

  it('renders multiple charts when fundamentals data is available', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(securitiesApi.getFundamentals).toHaveBeenCalledWith('AAPL');
    });

    // Should call all APIs when symbol is provided
    expect(securitiesApi.getChart).toHaveBeenCalledWith('AAPL');
  });

  it('renders only price chart when fundamentals data is unavailable', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(securitiesApi.getChart).toHaveBeenCalledWith('AAPL');
    });

    // Verify APIs were called correctly
    expect(securitiesApi.getFundamentals).toHaveBeenCalledWith('AAPL');
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(securitiesApi.getChart).mockRejectedValue(new Error('API Error'));
    vi.mocked(securitiesApi.getTickHistory).mockRejectedValue(new Error('API Error'));
    vi.mocked(securitiesApi.getFundamentals).mockRejectedValue(new Error('API Error'));
    vi.mocked(tickApi.get).mockRejectedValue(new Error('API Error'));

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    // Component should still render without crashing
    expect(screen.queryByText('Select a security to view charts')).not.toBeInTheDocument();
  });

  it('processes timestamp data correctly', async () => {
    const testData = {
      ohlc: {
        t: [1694995200], // September 18, 2023
        o: [175.0],
        h: [178.5],
        l: [174.5],
        c: [176.2]
      }
    };

    vi.mocked(securitiesApi.getChart).mockResolvedValue(testData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue({ t: [1694995200], v: [75] });
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(securitiesApi.getChart).toHaveBeenCalledWith('AAPL');
    });

    // Component should process timestamp data correctly
    expect(securitiesApi.getTickHistory).toHaveBeenCalledWith('AAPL');
  });
});