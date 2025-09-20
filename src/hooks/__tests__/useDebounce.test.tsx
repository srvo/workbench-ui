import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Should still be the old value immediately
    expect(result.current).toBe('initial');

    // Fast-forward time but not enough to trigger debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe('initial');

    // Fast-forward past the debounce delay
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('resets timer on consecutive updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    // First update
    rerender({ value: 'first', delay: 500 });

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Second update before first one resolves
    rerender({ value: 'second', delay: 500 });

    // Advance time partially again
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should still be initial value
    expect(result.current).toBe('initial');

    // Complete the debounce period
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should have the latest value
    expect(result.current).toBe('second');
  });

  it('handles different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 }
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Advance by less than the delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('initial');

    // Complete the full delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('updates immediately when delay is 0', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 }
      }
    );

    rerender({ value: 'updated', delay: 0 });

    // Advance timers to process any potential timeouts
    act(() => {
      vi.runAllTimers();
    });

    // Should update immediately with 0 delay
    expect(result.current).toBe('updated');
  });

  it('handles null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: null, delay: 500 }
      }
    );

    expect(result.current).toBe(null);

    rerender({ value: undefined, delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(undefined);
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    rerender({ value: 'updated', delay: 500 });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});