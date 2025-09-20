import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UniversePanel from '../../components/Universe/UniversePanel';
import React from 'react';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Frontend API Integration Debug', () => {
  it('should render UniversePanel and load securities', async () => {
    const mockOnSelectSymbol = vi.fn();

    render(
      <TestWrapper>
        <UniversePanel
          selectedSymbol={null}
          onSelectSymbol={mockOnSelectSymbol}
        />
      </TestWrapper>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(
      () => {
        // Should not show "No results found" if API is working
        expect(screen.queryByText('No results found')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Should show securities count
    await waitFor(
      () => {
        const resultsText = screen.getByText(/\d+ results • Use ↑↓ to navigate/);
        expect(resultsText).toBeInTheDocument();

        // Extract the number from the text
        const match = resultsText.textContent?.match(/(\d+) results/);
        const count = match ? parseInt(match[1]) : 0;
        expect(count).toBeGreaterThan(0);
      },
      { timeout: 10000 }
    );
  });

  it('should search for AGM and find results', async () => {
    const mockOnSelectSymbol = vi.fn();

    render(
      <TestWrapper>
        <UniversePanel
          selectedSymbol={null}
          onSelectSymbol={mockOnSelectSymbol}
        />
      </TestWrapper>
    );

    // Find and type in search box
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();

    await userEvent.type(searchInput, 'agm');

    // Wait for search results
    await waitFor(
      () => {
        // Should find AGM
        expect(screen.getByText('AGM')).toBeInTheDocument();
        expect(screen.getByText('Farmer Mac')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});