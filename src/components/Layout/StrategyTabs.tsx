import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetcher } from '../../lib/fetch';
import type { Strategy } from '../../api/types';
import clsx from 'clsx';

const StrategyTabs: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<string>('all');

  const { data: strategies = [] } = useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: () => fetcher.get('/api/strategies'),
    staleTime: Infinity,
  });

  const allTabs = [
    { key: 'all', name: 'All Securities' },
    ...strategies,
  ];

  return (
    <nav className="flex space-x-4">
      {allTabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={clsx(
            'px-3 py-1 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key ? 'tab-active' : 'tab-inactive'
          )}
        >
          {tab.name}
        </button>
      ))}
    </nav>
  );
};

export default StrategyTabs;