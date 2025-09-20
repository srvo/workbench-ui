import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchBar from './SearchBar';
import Filters from './Filters';
import ResultRow from './ResultRow';
import { securitiesApi } from '../../api/securities';
import type { Security } from '../../api/types';
import { useDebounce } from '../../hooks/useDebounce';

interface UniversePanelProps {
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
}

const UniversePanel: React.FC<UniversePanelProps> = ({
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unseen30' | 'unseen90'>('all');
  const [shuffle, setShuffle] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build query params
  const queryParams = React.useMemo(() => {
    const params: any = {
      limit: 500,
      shuffle: shuffle ? 1 : 0,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (filter === 'unseen30') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      params.review_before = date.toISOString().split('T')[0];
    } else if (filter === 'unseen90') {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      params.review_before = date.toISOString().split('T')[0];
    }

    return params;
  }, [debouncedSearch, filter, shuffle]);

  const { data: securities = [], isLoading } = useQuery<Security[]>({
    queryKey: ['securities', queryParams],
    queryFn: () => {
      // If no search query and no filter, load top-tick investable securities
      if (!debouncedSearch && filter === 'all') {
        return securitiesApi.getInvestableTicks().then(ticks =>
          ticks.map((tick: any) => ({
            symbol: tick.symbol,
            name: tick.name,
            sector: tick.sector,
            industry: tick.sector, // Use sector as industry
            is_excluded: false, // All investable securities are not excluded
            last_tick_at: tick.updated_at?.split('T')[0] // Convert to date format
          }))
        );
      }
      return securitiesApi.search(queryParams);
    },
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle if typing in input
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, securities.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && securities[selectedIndex]) {
        onSelectSymbol(securities[selectedIndex].symbol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [securities, selectedIndex, onSelectSymbol]);

  // Update selected symbol when index changes
  useEffect(() => {
    if (securities[selectedIndex]) {
      onSelectSymbol(securities[selectedIndex].symbol);
    }
  }, [selectedIndex, securities, onSelectSymbol]);

  const handleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
    setSelectedIndex(0);
  }, []);

  const handleFilterChange = useCallback((newFilter: typeof filter) => {
    setFilter(newFilter);
    setSelectedIndex(0);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <Filters
          filter={filter}
          onFilterChange={handleFilterChange}
          onShuffle={handleShuffle}
          shuffleActive={shuffle}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : securities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No results found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {securities.map((security, index) => (
              <ResultRow
                key={security.symbol}
                security={security}
                isSelected={selectedSymbol === security.symbol}
                isHighlighted={index === selectedIndex}
                onClick={() => {
                  setSelectedIndex(index);
                  onSelectSymbol(security.symbol);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        {securities.length} results • Use ↑↓ to navigate
      </div>
    </div>
  );
};

export default UniversePanel;