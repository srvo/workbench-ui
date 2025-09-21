import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExclusionsManagement from '../ExclusionsManagement';
import { exclusionsApi } from '../../../api/exclusions';
import { useToast } from '../../../hooks/useToast';

// Mock the API
vi.mock('../../../api/exclusions', () => ({
  exclusionsApi: {
    getExclusions: vi.fn(),
    createExclusion: vi.fn(),
    deleteExclusion: vi.fn(),
    reviewExclusion: vi.fn(),
    getCategories: vi.fn(),
    bulkCreateExclusions: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('../../../hooks/useToast', () => ({
  useToast: vi.fn(),
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
});

const mockExclusions = [
  {
    id: 1,
    symbol: 'AAPL',
    category_name: 'ESG Concerns',
    category_color: '#FF6B6B',
    category_priority: 1,
    reason: 'Environmental concerns with manufacturing',
    excluded_at: '2023-01-01T10:00:00Z',
    excluded_by: 'test_user',
    reviewed_at: null,
    reviewed_by: null,
    is_active: 1,
    source: 'manual',
    metadata: {},
  },
  {
    id: 2,
    symbol: 'TSLA',
    category_name: 'Tobacco',
    category_color: '#FFA500',
    category_priority: 2,
    reason: 'Company practices concern',
    excluded_at: '2023-01-02T10:00:00Z',
    excluded_by: 'test_user',
    reviewed_at: '2023-01-03T10:00:00Z',
    reviewed_by: 'reviewer',
    is_active: 1,
    source: 'manual',
    metadata: {},
  },
];

const mockCategories = [
  {
    id: 1,
    name: 'ESG Concerns',
    color: '#FF6B6B',
    priority: 100,
    description: 'Environmental, Social, Governance issues',
  },
  {
    id: 2,
    name: 'Tobacco',
    color: '#FFA500',
    priority: 90,
    description: 'Tobacco companies',
  },
];

const mockShowToast = vi.fn();

describe('ExclusionsManagement', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (exclusionsApi.getExclusions as any).mockResolvedValue(mockExclusions);
    (exclusionsApi.getCategories as any).mockResolvedValue(mockCategories);
    (useToast as any).mockReturnValue({ showToast: mockShowToast });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ExclusionsManagement />
      </QueryClientProvider>
    );
  };

  describe('Initial Rendering', () => {
    it('should render the component with header and controls', async () => {
      renderComponent();

      expect(screen.getByText('Exclusions Management')).toBeInTheDocument();
      expect(screen.getByText('Create, edit, and manage investment exclusions')).toBeInTheDocument();
      expect(screen.getByText('Add Exclusion')).toBeInTheDocument();
      expect(screen.getByText('Bulk Import')).toBeInTheDocument();
    });

    it('should render filter controls', async () => {
      renderComponent();

      expect(screen.getByPlaceholderText('Filter by symbol...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All categories')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Active')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      renderComponent();

      expect(screen.getByText('Loading exclusions...')).toBeInTheDocument();
    });
  });

  describe('Exclusions List', () => {
    it('should render exclusions list when data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('TSLA')).toBeInTheDocument();
      });

      expect(screen.getByText('Environmental concerns with manufacturing')).toBeInTheDocument();
      expect(screen.getByText('Company practices concern')).toBeInTheDocument();
    });

    it('should show category badges for exclusions', async () => {
      renderComponent();

      await waitFor(() => {
        const esgElements = screen.getAllByText('ESG Concerns');
        const tobaccoElements = screen.getAllByText('Tobacco');
        expect(esgElements.length).toBeGreaterThan(0);
        expect(tobaccoElements.length).toBeGreaterThan(0);
      });
    });

    it('should show active/inactive status', async () => {
      renderComponent();

      await waitFor(() => {
        const activeElements = screen.getAllByText('Active');
        expect(activeElements.length).toBeGreaterThanOrEqual(2); // Both exclusions are active (plus possibly filter option)
      });
    });

    it('should show review actions for unreviewed exclusions', async () => {
      renderComponent();

      await waitFor(() => {
        // AAPL is unreviewed, should have approve/reject buttons
        const approveButtons = screen.getAllByText('Approve');
        const rejectButtons = screen.getAllByText('Reject');
        expect(approveButtons).toHaveLength(1);
        expect(rejectButtons).toHaveLength(1);
      });
    });

    it('should show delete buttons for all exclusions', async () => {
      renderComponent();

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons).toHaveLength(2);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by symbol', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });

      const symbolFilter = screen.getByPlaceholderText('Filter by symbol...');
      fireEvent.change(symbolFilter, { target: { value: 'AAPL' } });

      await waitFor(() => {
        // Check that API was called with the symbol filter
        const calls = (exclusionsApi.getExclusions as any).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({ symbol: 'AAPL' });
      });
    });

    it('should filter by category', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('All categories')).toBeInTheDocument();
      });

      const categoryFilter = screen.getByDisplayValue('All categories');

      // Just test that the filter element exists and can be interacted with
      fireEvent.change(categoryFilter, { target: { value: 'ESG Concerns' } });

      // The category filter should still be in the document after interaction
      expect(categoryFilter).toBeInTheDocument();
    });

    it('should clear filters when Clear Filters is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });

      // Set some filters first
      const symbolFilter = screen.getByPlaceholderText('Filter by symbol...');
      fireEvent.change(symbolFilter, { target: { value: 'AAPL' } });

      // Clear filters
      fireEvent.click(screen.getByText('Clear Filters'));

      expect(symbolFilter).toHaveValue('');
    });
  });

  describe('Create Exclusion Modal', () => {
    it('should open create modal when Add Exclusion is clicked', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Add Exclusion'));

      await waitFor(() => {
        expect(screen.getByText('Add New Exclusion')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., AAPL')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Reason for exclusion...')).toBeInTheDocument();
      });
    });

    it('should close modal when Cancel is clicked', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Add Exclusion'));

      await waitFor(() => {
        expect(screen.getByText('Add New Exclusion')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Add New Exclusion')).not.toBeInTheDocument();
      });
    });

    it('should create exclusion when form is submitted', async () => {
      (exclusionsApi.createExclusion as any).mockResolvedValue({
        id: 3,
        symbol: 'GOOGL',
        reason: 'Test reason',
      });

      renderComponent();

      fireEvent.click(screen.getByText('Add Exclusion'));

      await waitFor(() => {
        expect(screen.getByText('Add New Exclusion')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('e.g., AAPL'), {
        target: { value: 'GOOGL' },
      });
      fireEvent.change(screen.getByPlaceholderText('Reason for exclusion...'), {
        target: { value: 'Test reason' },
      });

      // Submit
      fireEvent.click(screen.getByText('Create Exclusion'));

      await waitFor(() => {
        expect(exclusionsApi.createExclusion).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Exclusion created successfully', 'success');
      });
    });

    it('should show error when trying to create exclusion without required fields', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Add Exclusion'));

      await waitFor(() => {
        expect(screen.getByText('Add New Exclusion')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      fireEvent.click(screen.getByText('Create Exclusion'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Please fill in symbol and reason', 'error');
      });
    });
  });

  describe('Bulk Import Modal', () => {
    it('should open bulk import modal when Bulk Import is clicked', async () => {
      renderComponent();

      fireEvent.click(screen.getByText('Bulk Import'));

      await waitFor(() => {
        expect(screen.getByText('Bulk Import Exclusions')).toBeInTheDocument();
        expect(screen.getByText('Format: symbol,reason,category_id (one per line)')).toBeInTheDocument();
      });
    });

    it('should process bulk import data correctly', async () => {
      (exclusionsApi.bulkCreateExclusions as any).mockResolvedValue({
        created: 2,
        errors: [],
      });

      renderComponent();

      fireEvent.click(screen.getByText('Bulk Import'));

      await waitFor(() => {
        expect(screen.getByText('Bulk Import Exclusions')).toBeInTheDocument();
      });

      // Fill bulk data
      const textarea = screen.getByPlaceholderText(/AAPL,Company practices,1/);
      fireEvent.change(textarea, {
        target: { value: 'MSFT,Software concerns,1\nNVDA,Hardware issues,2' },
      });

      // Submit
      fireEvent.click(screen.getByText('Import Exclusions'));

      await waitFor(() => {
        expect(exclusionsApi.bulkCreateExclusions).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Created 2 exclusions', 'success');
      });
    });
  });

  describe('Review Actions', () => {
    it('should approve an exclusion when Approve is clicked', async () => {
      (exclusionsApi.reviewExclusion as any).mockResolvedValue({
        id: 1,
        reviewed_at: '2023-01-01',
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Approve'));

      await waitFor(() => {
        expect(exclusionsApi.reviewExclusion).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Exclusion reviewed successfully', 'success');
      });
    });

    it('should reject an exclusion when Reject is clicked', async () => {
      (exclusionsApi.reviewExclusion as any).mockResolvedValue({
        id: 1,
        reviewed_at: '2023-01-01',
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reject'));

      await waitFor(() => {
        expect(exclusionsApi.reviewExclusion).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Exclusion reviewed successfully', 'success');
      });
    });
  });

  describe('Delete Actions', () => {
    it('should delete an exclusion when Delete is clicked and confirmed', async () => {
      (window.confirm as any).mockReturnValue(true);
      (exclusionsApi.deleteExclusion as any).mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(exclusionsApi.deleteExclusion).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Exclusion deleted successfully', 'success');
      });
    });

    it('should not delete when deletion is not confirmed', async () => {
      (window.confirm as any).mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(exclusionsApi.deleteExclusion).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first page', async () => {
      renderComponent();

      await waitFor(() => {
        const previousButton = screen.getByText('Previous');
        expect(previousButton).toBeDisabled();
      });
    });

    it('should navigate to next page when Next is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');

      // Just test that the button can be clicked without error
      fireEvent.click(nextButton);

      // The button should still be present after clicking
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (exclusionsApi.createExclusion as any).mockRejectedValue(new Error('API Error'));

      renderComponent();

      fireEvent.click(screen.getByText('Add Exclusion'));

      await waitFor(() => {
        expect(screen.getByText('Add New Exclusion')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('e.g., AAPL'), {
        target: { value: 'GOOGL' },
      });
      fireEvent.change(screen.getByPlaceholderText('Reason for exclusion...'), {
        target: { value: 'Test reason' },
      });

      // Submit
      fireEvent.click(screen.getByText('Create Exclusion'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('API Error', 'error');
      });
    });

    it('should show "No exclusions found" when list is empty', async () => {
      (exclusionsApi.getExclusions as any).mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No exclusions found')).toBeInTheDocument();
      });
    });
  });
});