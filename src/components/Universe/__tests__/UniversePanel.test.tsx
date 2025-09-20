import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UniversePanel from '../UniversePanel';
import { securitiesApi } from '../../../api/securities';

vi.mock('../../../api/securities', () => ({
  securitiesApi: {
    getAll: vi.fn()
  }
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

const mockSecurities = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    market_cap: 3000000000000,
    price: 175.50,
    tick_score: 85
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    industry: 'Internet Services',
    market_cap: 2000000000000,
    price: 140.25,
    tick_score: 75
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    industry: 'Banks',
    market_cap: 500000000000,
    price: 155.75,
    tick_score: 65
  }
];

describe('UniversePanel', () => {
  const mockOnSelectSymbol = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(securitiesApi.getAll).mockResolvedValue({
      items: mockSecurities,
      total: 3,
      limit: 50,
      offset: 0
    });
  });

  it('renders loading state initially', () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays securities list after loading', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('JPM')).toBeInTheDocument();
    });
  });

  it('handles security selection', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('AAPL'));
    expect(mockOnSelectSymbol).toHaveBeenCalledWith('AAPL');
  });

  it('highlights selected security', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol="GOOGL"
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      const googleRow = screen.getByText('GOOGL').closest('div');
      expect(googleRow).toHaveClass('bg-lavender/10');
    });
  });

  it('filters securities by search term', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search securities...');
    fireEvent.change(searchInput, { target: { value: 'Apple' } });

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
      expect(screen.queryByText('JPM')).not.toBeInTheDocument();
    });
  });

  it('filters by sector', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    const sectorSelect = screen.getByDisplayValue('All Sectors');
    fireEvent.change(sectorSelect, { target: { value: 'Financial Services' } });

    await waitFor(() => {
      expect(screen.getByText('JPM')).toBeInTheDocument();
      expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
      expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
    });
  });

  it('sorts by tick score', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Tick Score (High → Low)');
    fireEvent.change(sortSelect, { target: { value: 'tick_score_asc' } });

    await waitFor(() => {
      const rows = screen.getAllByText(/^\w+$/);
      const symbols = rows.filter(row => ['AAPL', 'GOOGL', 'JPM'].includes(row.textContent!));
      expect(symbols[0]).toHaveTextContent('JPM'); // 65
      expect(symbols[1]).toHaveTextContent('GOOGL'); // 75
      expect(symbols[2]).toHaveTextContent('AAPL'); // 85
    });
  });

  it('handles keyboard navigation', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    const container = screen.getByText('AAPL').closest('.overflow-y-auto');

    fireEvent.keyDown(container!, { key: 'ArrowDown' });
    expect(mockOnSelectSymbol).toHaveBeenCalledWith('GOOGL');

    fireEvent.keyDown(container!, { key: 'ArrowUp' });
    expect(mockOnSelectSymbol).toHaveBeenCalledWith('AAPL');

    fireEvent.keyDown(container!, { key: 'Enter' });
    expect(mockOnSelectSymbol).toHaveBeenCalledWith('AAPL');
  });

  it('displays security stats correctly', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('$175.50')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('$3.00T')).toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search securities...');
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    renderWithQuery(
      <UniversePanel
        selectedSymbol={null}
        onSelectSymbol={mockOnSelectSymbol}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('3 securities')).toBeInTheDocument();
    });
  });
});