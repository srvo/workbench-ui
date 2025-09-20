import React from 'react';
import clsx from 'clsx';

interface FiltersProps {
  filter: 'all' | 'unseen30' | 'unseen90';
  onFilterChange: (filter: 'all' | 'unseen30' | 'unseen90') => void;
  onShuffle: () => void;
  shuffleActive: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  filter,
  onFilterChange,
  onShuffle,
  shuffleActive,
}) => {
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={onShuffle}
        className={clsx(
          'btn-secondary text-sm',
          shuffleActive && 'bg-brand-lavender text-white hover:bg-brand-purple'
        )}
      >
        🎲 Shuffle
      </button>
      <button
        onClick={() => onFilterChange('unseen30')}
        className={clsx(
          'btn-secondary text-sm',
          filter === 'unseen30' && 'bg-brand-lavender text-white hover:bg-brand-purple'
        )}
      >
        Unseen 30d
      </button>
      <button
        onClick={() => onFilterChange('unseen90')}
        className={clsx(
          'btn-secondary text-sm',
          filter === 'unseen90' && 'bg-brand-lavender text-white hover:bg-brand-purple'
        )}
      >
        Unseen 90d
      </button>
      {filter !== 'all' && (
        <button
          onClick={() => onFilterChange('all')}
          className="text-sm text-brand-purple hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
};

export default Filters;