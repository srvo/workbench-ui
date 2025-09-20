import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TickScore from '../TickScore';
import { tickApi } from '../../../api/tick';
import { ToastProvider } from '../../../hooks/useToast';

vi.mock('../../../api/tick');

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
      <ToastProvider>
        {component}
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('TickScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when symbol is null', () => {
    renderWithProviders(<TickScore symbol={null} />);
    expect(screen.getByText('Select a security')).toBeInTheDocument();
  });

  it('fetches and displays tick score for valid symbol', async () => {
    const mockTickData = { score: 75, updated_at: '2025-09-20T10:00:00Z' };
    vi.mocked(tickApi.get).mockResolvedValue(mockTickData);

    renderWithProviders(<TickScore symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    });
  });

  it('handles score input changes and triggers autosave', async () => {
    const mockTickData = { score: 75, updated_at: '2025-09-20T10:00:00Z' };
    vi.mocked(tickApi.get).mockResolvedValue(mockTickData);
    vi.mocked(tickApi.update).mockResolvedValue({ score: 80 });

    renderWithProviders(<TickScore symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('75');
    fireEvent.change(input, { target: { value: '80' } });

    await waitFor(() => {
      expect(tickApi.update).toHaveBeenCalledWith('AAPL', 80);
    }, { timeout: 500 });
  });

  it('handles keyboard navigation with arrow keys', async () => {
    const mockTickData = { score: 75, updated_at: '2025-09-20T10:00:00Z' };
    vi.mocked(tickApi.get).mockResolvedValue(mockTickData);

    renderWithProviders(<TickScore symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('75');
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(input).toHaveValue(76);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(input).toHaveValue(74);
  });

  it('enforces score bounds (-100 to 100)', async () => {
    const mockTickData = { score: 95, updated_at: '2025-09-20T10:00:00Z' };
    vi.mocked(tickApi.get).mockResolvedValue(mockTickData);

    renderWithProviders(<TickScore symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('95')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('95');

    // Test upper bound
    fireEvent.change(input, { target: { value: '150' } });
    expect(input).toHaveValue(100);

    // Test lower bound
    fireEvent.change(input, { target: { value: '-150' } });
    expect(input).toHaveValue(-100);
  });

  it('displays error state when API call fails', async () => {
    vi.mocked(tickApi.get).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<TickScore symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByText('Error loading tick score')).toBeInTheDocument();
    });
  });
});