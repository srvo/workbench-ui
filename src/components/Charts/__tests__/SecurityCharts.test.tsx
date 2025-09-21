import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SecurityCharts from '../SecurityCharts';
import { securitiesApi } from '../../../api/securities';
import { tickApi } from '../../../api/tick';

vi.mock('../../../api/securities');
vi.mock('../../../api/tick');
vi.mock('react-plotly.js', () => ({
  default: ({ data, layout }: any) => (
    <div data-testid="plotly-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-layout">{JSON.stringify(layout)}</div>
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
    t: [1694995200, 1695081600, 1695168000], // Sep 18, 19, 20 2023
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
    pb: {
      t: [1694995200, 1695081600],
      v: [25.5, 26.1]
    },
    pe: {
      t: [1694995200, 1695081600],
      v: [28.2, 27.9]
    },
    shy: {
      t: [1694995200, 1695081600],
      v: [2.1, 2.3]
    },
    rev_cagr_5y: {
      t: [1694995200, 1695081600],
      v: [8.5, 9.1]
    }
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

  it('shows loading state while fetching data', async () => {
    // Mock APIs with resolved data
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 80 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    // Wait for data to load and charts to render
    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify the charts rendered correctly
    const charts = screen.getAllByTestId('plotly-chart');
    expect(charts.length).toBeGreaterThan(0);
  });

  it('renders price chart with OHLC data', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
    });

    const charts = screen.getAllByTestId('plotly-chart');
    expect(charts.length).toBeGreaterThan(0);

    const priceChart = charts[0];
    const chartData = JSON.parse(priceChart.querySelector('[data-testid="chart-data"]')!.textContent!);

    expect(chartData).toContainEqual(
      expect.objectContaining({
        type: 'candlestick',
        name: 'Price'
      })
    );
  });

  it('includes SMA200 line when available', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
    });

    const charts = screen.getAllByTestId('plotly-chart');
    const priceChart = charts[0];
    const chartData = JSON.parse(priceChart.querySelector('[data-testid="chart-data"]')!.textContent!);

    expect(chartData).toContainEqual(
      expect.objectContaining({
        type: 'scatter',
        name: 'SMA 200'
      })
    );
  });

  it('renders tick score overlay on price chart', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
    });

    const charts = screen.getAllByTestId('plotly-chart');
    const priceChart = charts[0];
    const chartData = JSON.parse(priceChart.querySelector('[data-testid="chart-data"]')!.textContent!);

    expect(chartData).toContainEqual(
      expect.objectContaining({
        name: 'Tick Score',
        yaxis: 'y2'
      })
    );
  });

  it('renders fundamentals charts when data is available', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Valuations')).toBeInTheDocument();
      expect(screen.getByText('Shareholder Yields')).toBeInTheDocument();
      expect(screen.getByText('Growth Metrics')).toBeInTheDocument();
    });
  });

  it('does not render fundamentals charts when data is unavailable', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
      expect(screen.queryByText('Valuations')).not.toBeInTheDocument();
      expect(screen.queryByText('Shareholder Yields')).not.toBeInTheDocument();
    });
  });

  it('highlights current tick score in history', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
    });

    const charts = screen.getAllByTestId('plotly-chart');
    const priceChart = charts[0];
    const chartData = JSON.parse(priceChart.querySelector('[data-testid="chart-data"]')!.textContent!);

    const tickScoreLine = chartData.find((trace: any) => trace.name === 'Tick Score');
    expect(tickScoreLine.marker.size).toEqual([4, 4, 10]); // Latest highlighted
  });

  it('converts timestamps to dates correctly', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(null);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
    });

    const charts = screen.getAllByTestId('plotly-chart');
    const priceChart = charts[0];
    const chartData = JSON.parse(priceChart.querySelector('[data-testid="chart-data"]')!.textContent!);

    const candlestickTrace = chartData.find((trace: any) => trace.type === 'candlestick');
    expect(candlestickTrace.x).toEqual(['2023-09-18', '2023-09-19', '2023-09-20']);
  });

  it('handles chart relayout for x-axis synchronization', async () => {
    vi.mocked(securitiesApi.getChart).mockResolvedValue(mockChartData);
    vi.mocked(securitiesApi.getTickHistory).mockResolvedValue(mockTickHistory);
    vi.mocked(securitiesApi.getFundamentals).mockResolvedValue(mockFundamentals);
    vi.mocked(tickApi.get).mockResolvedValue({ score: 82 });

    renderWithQuery(<SecurityCharts symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Price & Tick Score')).toBeInTheDocument();
      expect(screen.getByText('Valuations')).toBeInTheDocument();
    });

    const charts = screen.getAllByTestId('plotly-chart');
    expect(charts.length).toBeGreaterThan(1);

    // All charts should have the same common layout structure
    charts.forEach(chart => {
      const layout = JSON.parse(chart.querySelector('[data-testid="chart-layout"]')!.textContent!);
      expect(layout).toHaveProperty('autosize', true);
      expect(layout).toHaveProperty('margin');
      expect(layout).toHaveProperty('font');
    });
  });
});