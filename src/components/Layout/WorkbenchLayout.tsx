import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import StrategyTabs from './StrategyTabs';

interface WorkbenchLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel
}) => {
  const location = useLocation();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-xl font-semibold text-brand-purple hover:text-brand-purple-dark">
            Workbench
          </Link>
          <StrategyTabs />
        </div>
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-3">
            <Link
              to="/"
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-brand-purple text-white'
                  : 'text-gray-600 hover:text-brand-purple hover:bg-gray-100'
              }`}
            >
              Research
            </Link>
            <Link
              to="/exclusions"
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                location.pathname === '/exclusions'
                  ? 'bg-brand-purple text-white'
                  : 'text-gray-600 hover:text-brand-purple hover:bg-gray-100'
              }`}
            >
              🚫 Exclusions
            </Link>
          </nav>
          <div className="text-sm text-gray-500">
            Investment Research Platform
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Universe */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          {leftPanel}
        </div>

        {/* Center Panel - Charts */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {centerPanel}
        </div>

        {/* Right Panel - Controls */}
        <div className="w-96 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

export default WorkbenchLayout;