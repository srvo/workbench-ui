import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tickApi } from '../../api/tick';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

interface TickScoreProps {
  symbol: string;
}

const TickScore: React.FC<TickScoreProps> = ({ symbol }) => {
  const [localScore, setLocalScore] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch current tick score
  const { data: tickData } = useQuery({
    queryKey: ['tick', symbol],
    queryFn: () => tickApi.get(symbol),
    enabled: !!symbol,
  });

  // Update local score when data changes
  useEffect(() => {
    if (tickData?.score !== undefined) {
      setLocalScore(tickData.score);
    }
  }, [tickData]);

  // Debounce score for autosave
  const debouncedScore = useDebounce(localScore, 400);

  // Mutation for updating tick score
  const updateMutation = useMutation({
    mutationFn: (score: number) => tickApi.update(symbol, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tick', symbol] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    },
    onError: (error) => {
      console.error('Failed to update tick score:', error);
      showToast('Failed to save tick score', 'error');
    },
  });

  // Autosave when debounced score changes
  useEffect(() => {
    if (debouncedScore !== null && debouncedScore !== tickData?.score) {
      updateMutation.mutate(debouncedScore);
    }
  }, [debouncedScore]);

  const handleIncrement = useCallback(() => {
    setLocalScore(prev => Math.min((prev || 0) + 1, 100));
  }, []);

  const handleDecrement = useCallback(() => {
    setLocalScore(prev => Math.max((prev || 0) - 1, -100));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || value === '-') {
      setLocalScore(null);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= -100 && num <= 100) {
      setLocalScore(num);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inputRef.current === document.activeElement) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleIncrement();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleDecrement();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleIncrement, handleDecrement]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrement}
          className="btn-icon"
          aria-label="Decrease score"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={localScore ?? ''}
            onChange={handleInputChange}
            className={clsx(
              'w-24 px-3 py-4 text-2xl font-bold text-center border-2 rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-lavender',
              tickData?.is_excluded ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            )}
            placeholder="—"
          />
          {tickData?.is_excluded && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded">
                Excluded
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleIncrement}
          className="btn-icon"
          aria-label="Increase score"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Success indicator */}
        <div className={clsx(
          'ml-2 transition-opacity duration-300',
          showSuccess ? 'opacity-100' : 'opacity-0'
        )}>
          <span className="text-green-500 text-xl">✓</span>
        </div>

        {/* Loading indicator */}
        {updateMutation.isPending && (
          <div className="ml-2">
            <div className="w-4 h-4 border-2 border-brand-lavender border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-2 text-center">
        Use ↑↓ arrows to adjust • Auto-saves
      </div>
    </div>
  );
};

export default TickScore;