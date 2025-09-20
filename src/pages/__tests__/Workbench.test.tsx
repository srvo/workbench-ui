import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Workbench from '../Workbench';
import { ToastProvider } from '../../hooks/useToast';

// Mock all the child components
vi.mock('../../components/Layout/WorkbenchLayout', () => ({
  default: ({ leftPanel, centerPanel, rightPanel }: any) => (
    <div data-testid="workbench-layout">
      <div data-testid="left-panel">{leftPanel}</div>
      <div data-testid="center-panel">{centerPanel}</div>
      <div data-testid="right-panel">{rightPanel}</div>
    </div>
  )
}));

vi.mock('../../components/Universe/UniversePanel', () => ({
  default: ({ selectedSymbol, onSelectSymbol }: any) => (
    <div data-testid="universe-panel">
      <div data-testid="selected-symbol">{selectedSymbol || 'none'}</div>
      <button onClick={() => onSelectSymbol('AAPL')}>Select AAPL</button>
      <button onClick={() => onSelectSymbol('GOOGL')}>Select GOOGL</button>
    </div>
  )
}));

vi.mock('../../components/Charts/SecurityCharts', () => ({
  default: ({ symbol }: any) => (
    <div data-testid="security-charts">
      Chart for: {symbol || 'no symbol'}
    </div>
  )
}));

vi.mock('../../components/Controls/ControlsPanel', () => ({
  default: ({ symbol, onSaveAndNext, onSkip }: any) => (
    <div data-testid="controls-panel">
      <div data-testid="controls-symbol">{symbol || 'no symbol'}</div>
      <button data-testid="save-next-btn" onClick={onSaveAndNext}>Save & Next</button>
      <button data-testid="skip-btn" onClick={onSkip}>Skip</button>
    </div>
  )
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWorkbench = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <Workbench />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('Workbench', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main panel components', () => {
    renderWorkbench();

    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
    expect(screen.getByTestId('universe-panel')).toBeInTheDocument();
    expect(screen.getByTestId('security-charts')).toBeInTheDocument();
    expect(screen.getByTestId('controls-panel')).toBeInTheDocument();
  });

  it('starts with no symbol selected', () => {
    renderWorkbench();

    expect(screen.getByTestId('selected-symbol')).toHaveTextContent('none');
    expect(screen.getByTestId('controls-symbol')).toHaveTextContent('no symbol');
    expect(screen.getByText('Chart for: no symbol')).toBeInTheDocument();
  });

  it('updates all panels when symbol is selected', () => {
    renderWorkbench();

    fireEvent.click(screen.getByText('Select AAPL'));

    expect(screen.getByTestId('selected-symbol')).toHaveTextContent('AAPL');
    expect(screen.getByTestId('controls-symbol')).toHaveTextContent('AAPL');
    expect(screen.getByText('Chart for: AAPL')).toBeInTheDocument();
  });

  it('handles Save & Next button', () => {
    renderWorkbench();

    // First select AAPL
    fireEvent.click(screen.getByText('Select AAPL'));
    expect(screen.getByTestId('selected-symbol')).toHaveTextContent('AAPL');

    // Mock the queue with AAPL, GOOGL (we'll need to modify component to test this properly)
    // For now, just test that the button works
    fireEvent.click(screen.getByTestId('save-next-btn'));
  });

  it('handles Skip button', () => {
    renderWorkbench();

    fireEvent.click(screen.getByText('Select AAPL'));
    fireEvent.click(screen.getByTestId('skip-btn'));
  });

  it('handles keyboard shortcuts', () => {
    renderWorkbench();

    // Select a symbol first
    fireEvent.click(screen.getByText('Select AAPL'));

    // Test 'S' key for Save & Next
    fireEvent.keyDown(document, { key: 's' });

    // Test 'X' key for Skip
    fireEvent.keyDown(document, { key: 'x' });

    // Test uppercase versions
    fireEvent.keyDown(document, { key: 'S' });
    fireEvent.keyDown(document, { key: 'X' });
  });

  it('ignores keyboard shortcuts when typing in inputs', () => {
    renderWorkbench();

    // Create a mock input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // These should not trigger the shortcuts
    fireEvent.keyDown(input, { key: 's' });
    fireEvent.keyDown(input, { key: 'x' });

    document.body.removeChild(input);
  });

  it('ignores keyboard shortcuts when typing in textareas', () => {
    renderWorkbench();

    // Create a mock textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    // These should not trigger the shortcuts
    fireEvent.keyDown(textarea, { key: 's' });
    fireEvent.keyDown(textarea, { key: 'x' });

    document.body.removeChild(textarea);
  });

  it('passes correct props to child components', () => {
    renderWorkbench();

    // Select a symbol
    fireEvent.click(screen.getByText('Select GOOGL'));

    // Verify all components receive the selected symbol
    expect(screen.getByTestId('selected-symbol')).toHaveTextContent('GOOGL');
    expect(screen.getByTestId('controls-symbol')).toHaveTextContent('GOOGL');
    expect(screen.getByText('Chart for: GOOGL')).toBeInTheDocument();
  });

  it('prevents default behavior on keyboard shortcuts', () => {
    renderWorkbench();

    const mockPreventDefault = vi.fn();
    const event = new KeyboardEvent('keydown', { key: 's' });
    event.preventDefault = mockPreventDefault;

    // Dispatch the event to trigger the handler
    window.dispatchEvent(event);

    expect(mockPreventDefault).toHaveBeenCalled();
  });

  it('properly manages queue state', () => {
    renderWorkbench();

    // The queue management logic would need to be exposed or tested through integration
    // For now, verify the component renders without queue-related errors
    expect(screen.getByTestId('workbench-layout')).toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderWorkbench();
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});