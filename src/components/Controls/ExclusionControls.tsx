import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '../../lib/fetch';
import clsx from 'clsx';
import { useToast } from '../../hooks/useToast';

interface ExclusionControlsProps {
  symbol: string;
}

const EXCLUSION_CATEGORIES = [
  { key: 'esg', name: 'ESG Concerns', color: 'bg-red-100 text-red-800' },
  { key: 'tobacco', name: 'Tobacco', color: 'bg-orange-100 text-orange-800' },
  { key: 'weapons', name: 'Weapons', color: 'bg-gray-100 text-gray-800' },
  { key: 'gambling', name: 'Gambling', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'other', name: 'Other', color: 'bg-blue-100 text-blue-800' },
];

const ExclusionControls: React.FC<ExclusionControlsProps> = ({ symbol }) => {
  const [showExcludeForm, setShowExcludeForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('esg');
  const [reason, setReason] = useState('');
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Check if security is currently excluded
  const { data: investableData } = useQuery({
    queryKey: ['security-exclusion-status', symbol],
    queryFn: () => fetcher.get(`/api/securities/tick/investable`),
    staleTime: 30 * 1000,
    enabled: !!symbol,
  });

  const isExcluded = investableData?.some((sec: any) =>
    sec.symbol === symbol && sec.is_excluded
  ) || false;

  // Exclude security mutation
  const excludeMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      return fetcher.post(`/api/securities/${symbol}/exclude`, data);
    },
    onSuccess: () => {
      showToast('Security excluded successfully', 'success');
      setShowExcludeForm(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['security-exclusion-status'] });
      queryClient.invalidateQueries({ queryKey: ['securities'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to exclude security', 'error');
    },
  });

  // Include security mutation
  const includeMutation = useMutation({
    mutationFn: async () => {
      return fetcher.post(`/api/securities/${symbol}/include`);
    },
    onSuccess: () => {
      showToast('Security included back in universe', 'success');
      queryClient.invalidateQueries({ queryKey: ['security-exclusion-status'] });
      queryClient.invalidateQueries({ queryKey: ['securities'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to include security', 'error');
    },
  });

  const handleExclude = () => {
    if (!reason.trim()) {
      showToast('Please provide a reason for exclusion', 'error');
      return;
    }

    const categoryName = EXCLUSION_CATEGORIES.find(c => c.key === selectedCategory)?.name || 'Other';
    excludeMutation.mutate({
      reason: `${categoryName}: ${reason}`
    });
  };

  const handleInclude = () => {
    includeMutation.mutate();
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 mb-2">
        Exclusion Status:
      </div>

      {isExcluded ? (
        // Security is excluded - show include option
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-800">
                <strong>Excluded</strong> from investment universe
              </div>
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          <button
            onClick={handleInclude}
            disabled={includeMutation.isPending}
            className={clsx(
              'w-full px-3 py-2 rounded-md text-sm font-medium transition-all',
              'bg-green-100 hover:bg-green-200 text-green-800',
              includeMutation.isPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            {includeMutation.isPending ? 'Including...' : 'Include Back in Universe'}
          </button>
        </div>
      ) : (
        // Security is not excluded - show exclude options
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-800">
                <strong>Included</strong> in investment universe
              </div>
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {!showExcludeForm ? (
            <button
              onClick={() => setShowExcludeForm(true)}
              className="w-full px-3 py-2 rounded-md text-sm font-medium bg-red-100 hover:bg-red-200 text-red-800 transition-all"
            >
              Exclude from Universe
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-sm font-medium text-gray-700">Exclude Security</div>

              {/* Category Selection */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Category:</label>
                <div className="grid grid-cols-2 gap-1">
                  {EXCLUSION_CATEGORIES.map(category => (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={clsx(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        selectedCategory === category.key
                          ? category.color
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Reason:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why should this security be excluded?"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleExclude}
                  disabled={excludeMutation.isPending || !reason.trim()}
                  className={clsx(
                    'flex-1 px-3 py-1 rounded text-sm font-medium transition-all',
                    'bg-red-600 hover:bg-red-700 text-white',
                    (excludeMutation.isPending || !reason.trim()) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {excludeMutation.isPending ? 'Excluding...' : 'Exclude'}
                </button>
                <button
                  onClick={() => {
                    setShowExcludeForm(false);
                    setReason('');
                  }}
                  className="flex-1 px-3 py-1 rounded text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExclusionControls;