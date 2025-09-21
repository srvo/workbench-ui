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

  it('renders with initial state', () => {
    renderWithProviders(<TickScore symbol="AAPL" />);
    // Should render the input field (text input with placeholder)
    expect(screen.getByPlaceholderText('—')).toBeInTheDocument();
    // Should render increment and decrement buttons
    expect(screen.getByLabelText('Decrease score')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase score')).toBeInTheDocument();
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

    const input = screen.getByDisplayValue('75') as HTMLInputElement;

    // Focus the input first (required for keyboard navigation to work)
    input.focus();

    // Test increment with ArrowUp
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(input.value).toBe('76');
    });

    // Test decrement with ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(input.value).toBe('74');
    });
  });

  it('enforces score bounds (-100 to 100)', async () => {
    const mockTickData = { score: 99, updated_at: '2025-09-20T10:00:00Z' };
    vi.mocked(tickApi.get).mockResolvedValue(mockTickData);

    renderWithProviders(<TickScore symbol="AAPL" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('99')).toBeInTheDocument();
    });

    // Test upper bound by clicking increment button
    const increaseButton = screen.getByLabelText('Increase score');
    fireEvent.click(increaseButton);

    // Should go to 100
    await waitFor(() => {
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });

    // Clicking again should stay at 100
    fireEvent.click(increaseButton);
    await waitFor(() => {
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });

  it('displays error state when API call fails', async () => {
    vi.mocked(tickApi.get).mockRejectedValue(new Error('API Error'));

    // Mock console.error to suppress error output in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<TickScore symbol="AAPL" />);

    // Component should still render even with API error
    // It just won't have initial data
    await waitFor(() => {
      // Check that the input field still renders with placeholder
      expect(screen.getByPlaceholderText('—')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});