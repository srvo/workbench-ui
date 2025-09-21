import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '../../lib/fetch';
import clsx from 'clsx';
import { useToast } from '../../hooks/useToast';

interface StrategyAssignmentProps {
  symbol: string;
}

const STRATEGIES = [
  { key: 'growth', name: 'Growth', color: 'bg-green-100 text-green-800' },
  { key: 'income', name: 'Income', color: 'bg-blue-100 text-blue-800' },
  { key: 'diversification', name: 'Diversification', color: 'bg-purple-100 text-purple-800' },
];

const StrategyAssignment: React.FC<StrategyAssignmentProps> = ({ symbol }) => {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current strategies for this specific security
  const { data: strategyData } = useQuery({
    queryKey: ['security-strategies', symbol],
    queryFn: () => fetcher.get(`/api/portfolios/${symbol}/strategies`),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!symbol,
  });

  // Update selected strategies when data changes
  useEffect(() => {
    if (strategyData?.strategies) {
      setSelectedStrategies(strategyData.strategies);
    }
  }, [strategyData]);

  // Mutation to update strategies
  const updateStrategies = useMutation({
    mutationFn: async (strategies: string[]) => {
      return fetcher.put(`/api/portfolios/${symbol}/strategies`, { strategies });
    },
    onSuccess: () => {
      showToast('Strategy assignments updated', 'success');
      // Invalidate both the specific security strategies and the global strategies
      queryClient.invalidateQueries({ queryKey: ['security-strategies', symbol] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update strategies', 'error');
    },
  });

  const toggleStrategy = (strategy: string) => {
    const newStrategies = selectedStrategies.includes(strategy)
      ? selectedStrategies.filter(s => s !== strategy)
      : [...selectedStrategies, strategy];

    setSelectedStrategies(newStrategies);
    updateStrategies.mutate(newStrategies);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 mb-2">
        Assign to portfolio strategies:
      </div>

      {STRATEGIES.map(strategy => (
        <button
          key={strategy.key}
          onClick={() => toggleStrategy(strategy.key)}
          disabled={updateStrategies.isPending}
          className={clsx(
            'w-full px-3 py-2 rounded-md text-sm font-medium transition-all',
            'flex items-center justify-between',
            selectedStrategies.includes(strategy.key)
              ? strategy.color
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700',
            updateStrategies.isPending && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span>{strategy.name}</span>
          {selectedStrategies.includes(strategy.key) && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}

      {updateStrategies.isPending && (
        <div className="text-xs text-gray-500 text-center">
          Updating strategies...
        </div>
      )}
    </div>
  );
};

export default StrategyAssignment;