import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MarkdownEditor from '../MarkdownEditor';
import { notesApi } from '../../../api/notes';
import { ToastProvider } from '../../../hooks/useToast';

vi.mock('../../../api/notes');

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

describe('MarkdownEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders editor with proper placeholder', () => {
    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText('Write a note... (Markdown supported)');
    expect(textarea).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles text input and saves note', async () => {
    vi.mocked(notesApi.create).mockResolvedValue({
      id: '1',
      symbol: 'AAPL',
      body_md: 'Test note',
      created_at: '2025-09-20T10:00:00Z'
    });

    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText('Write a note... (Markdown supported)');
    fireEvent.change(textarea, { target: { value: 'Test note content' } });

    const saveButton = screen.getByText('Save Note');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(notesApi.create).toHaveBeenCalledWith('AAPL', 'Test note content');
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('disables save button when content is empty', () => {
    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('Save Note');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when content is added', () => {
    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText('Write a note... (Markdown supported)');
    fireEvent.change(textarea, { target: { value: 'Some content' } });

    const saveButton = screen.getByText('Save Note');
    expect(saveButton).not.toBeDisabled();
  });

  it('shows saving state during save', async () => {
    vi.mocked(notesApi.create).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        id: '1',
        symbol: 'AAPL',
        body_md: 'Test',
        created_at: '2025-09-20T10:00:00Z'
      }), 100))
    );

    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText('Write a note... (Markdown supported)');
    fireEvent.change(textarea, { target: { value: 'Test content' } });

    const saveButton = screen.getByText('Save Note');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('handles keyboard shortcut for save', () => {
    renderWithProviders(
      <MarkdownEditor
        symbol="AAPL"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText('Write a note... (Markdown supported)');
    fireEvent.change(textarea, { target: { value: 'Test content' } });

    // Focus the textarea and trigger Ctrl+Enter
    textarea.focus();
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    expect(notesApi.create).toHaveBeenCalledWith('AAPL', 'Test content');
  });
});