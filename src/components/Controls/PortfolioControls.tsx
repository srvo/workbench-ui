import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '../../lib/fetch';
import clsx from 'clsx';
import { useToast } from '../../hooks/useToast';

interface PortfolioControlsProps {
  symbol: string;
}

interface Portfolio {
  id: string;
  name: string;
  min_tick?: number;
}

interface Holding {
  symbol: string;
  weight: number;
  qty?: number;
  price?: number;
}

const PortfolioControls: React.FC<PortfolioControlsProps> = ({ symbol }) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [minTick, setMinTick] = useState<number | undefined>(undefined);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch portfolios
  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => fetcher.get('/api/portfolios'),
    staleTime: 60 * 1000,
  });

  // Fetch holdings for selected portfolio
  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio-holdings', selectedPortfolioId],
    queryFn: () => fetcher.get(`/api/portfolios/${selectedPortfolioId}/holdings`),
    staleTime: 30 * 1000,
    enabled: !!selectedPortfolioId,
  });

  // Create portfolio mutation
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: { name: string; min_tick?: number }) => {
      return fetcher.post('/api/portfolios', data);
    },
    onSuccess: (data) => {
      showToast('Portfolio created successfully', 'success');
      setShowCreateForm(false);
      setNewPortfolioName('');
      setMinTick(undefined);
      setSelectedPortfolioId(data.id);
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create portfolio', 'error');
    },
  });

  // Add to portfolio mutation
  const addToPortfolioMutation = useMutation({
    mutationFn: async (data: { portfolioId: string; trade: any }) => {
      return fetcher.post(`/api/portfolios/${data.portfolioId}/trades`, data.trade);
    },
    onSuccess: () => {
      showToast(`Added ${symbol} to portfolio`, 'success');
      queryClient.invalidateQueries({ queryKey: ['portfolio-holdings', selectedPortfolioId] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to add to portfolio', 'error');
    },
  });

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) {
      showToast('Please enter a portfolio name', 'error');
      return;
    }

    createPortfolioMutation.mutate({
      name: newPortfolioName,
      min_tick: minTick,
    });
  };

  const handleAddToPortfolio = () => {
    if (!selectedPortfolioId) {
      showToast('Please select a portfolio', 'error');
      return;
    }

    // Add a simple trade entry (in real implementation, you'd want qty/price inputs)
    addToPortfolioMutation.mutate({
      portfolioId: selectedPortfolioId,
      trade: {
        date: new Date().toISOString().split('T')[0],
        symbol: symbol,
        qty: 100, // Default quantity
        price: 100, // Default price - in real implementation, fetch current price
        note: `Added from workbench on ${new Date().toISOString()}`,
      },
    });
  };

  const selectedPortfolio = portfolios.find((p: Portfolio) => p.id === selectedPortfolioId);
  const currentHolding = holdings.find((h: Holding) => h.symbol === symbol);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 mb-2">
        Portfolio Management:
      </div>

      {/* Portfolio Selection */}
      <div>
        <label className="text-xs text-gray-600 mb-1 block">Select Portfolio:</label>
        <select
          value={selectedPortfolioId}
          onChange={(e) => setSelectedPortfolioId(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">-- Select Portfolio --</option>
          {portfolios.map((portfolio: Portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
              {portfolio.min_tick && ` (Min Tick: ${portfolio.min_tick})`}
            </option>
          ))}
        </select>
      </div>

      {/* Create New Portfolio */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full px-3 py-2 rounded-md text-sm font-medium bg-blue-100 hover:bg-blue-200 text-blue-800 transition-all"
        >
          Create New Portfolio
        </button>
      ) : (
        <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-sm font-medium text-gray-700">Create Portfolio</div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Name:</label>
            <input
              type="text"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Portfolio name"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Min Tick Score (optional):</label>
            <input
              type="number"
              value={minTick || ''}
              onChange={(e) => setMinTick(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 70"
              min="-100"
              max="100"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreatePortfolio}
              disabled={createPortfolioMutation.isPending || !newPortfolioName.trim()}
              className={clsx(
                'flex-1 px-3 py-1 rounded text-sm font-medium transition-all',
                'bg-blue-600 hover:bg-blue-700 text-white',
                (createPortfolioMutation.isPending || !newPortfolioName.trim()) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {createPortfolioMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewPortfolioName('');
                setMinTick(undefined);
              }}
              className="flex-1 px-3 py-1 rounded text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Holding Status */}
      {selectedPortfolio && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            Status in <strong>{selectedPortfolio.name}</strong>:
          </div>

          {currentHolding ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="text-sm text-green-800">
                  <strong>Held</strong> - {(currentHolding.weight * 100).toFixed(2)}% weight
                </div>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {currentHolding.qty && (
                <div className="text-xs text-green-700 mt-1">
                  Quantity: {currentHolding.qty}
                  {currentHolding.price && ` @ $${currentHolding.price}`}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm text-gray-700">
                  Not currently held in this portfolio
                </div>
              </div>

              <button
                onClick={handleAddToPortfolio}
                disabled={addToPortfolioMutation.isPending}
                className={clsx(
                  'w-full px-3 py-2 rounded-md text-sm font-medium transition-all',
                  'bg-green-100 hover:bg-green-200 text-green-800',
                  addToPortfolioMutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {addToPortfolioMutation.isPending ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Portfolio Holdings Count */}
      {selectedPortfolio && holdings.length > 0 && (
        <div className="text-xs text-gray-500">
          Portfolio has {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default PortfolioControls;