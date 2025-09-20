import React from 'react';
import clsx from 'clsx';
import type { Security } from '../../api/types';
import { formatRelativeTime } from '../../lib/format';

interface ResultRowProps {
  security: Security;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({
  security,
  isSelected,
  isHighlighted,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'px-4 py-3 cursor-pointer transition-colors',
        isSelected && 'bg-purple-100',
        isHighlighted && 'bg-teal-100',
        !isSelected && !isHighlighted && 'hover:bg-gray-50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-purple-700">
              {security.symbol}
            </span>
            {security.is_excluded && (
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                Excluded
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 truncate">
            {security.name}
          </div>
          {security.sector && (
            <div className="text-xs text-gray-500 mt-1">
              {security.sector}
            </div>
          )}
        </div>
        {security.last_tick_at && (
          <div className="text-xs text-gray-400 ml-2">
            {formatRelativeTime(security.last_tick_at)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultRow;