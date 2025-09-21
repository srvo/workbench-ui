import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExclusionsDashboard from '../components/Exclusions/ExclusionsDashboard';
import CategoriesPanel from '../components/Exclusions/CategoriesPanel';
import SourceMappingsPanel from '../components/Exclusions/SourceMappingsPanel';
import DataQualityPanel from '../components/Exclusions/DataQualityPanel';
import SharadarCoveragePanel from '../components/Exclusions/SharadarCoveragePanel';
import IngestionLogsPanel from '../components/Exclusions/IngestionLogsPanel';
import ExclusionsManagement from '../components/Exclusions/ExclusionsManagement';

type TabType = 'dashboard' | 'manage' | 'categories' | 'mappings' | 'quality' | 'coverage' | 'logs';

const Exclusions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'manage', label: '⚙️ Manage Exclusions', icon: '⚙️' },
    { id: 'categories', label: '🏷️  Categories', icon: '🏷️' },
    { id: 'mappings', label: '🔗 Source Mappings', icon: '🔗' },
    { id: 'quality', label: '🔍 Data Quality', icon: '🔍' },
    { id: 'coverage', label: '📈 Sharadar Coverage', icon: '📈' },
    { id: 'logs', label: '📋 Ingestion Logs', icon: '📋' }
  ];

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExclusionsDashboard />;
      case 'manage':
        return <ExclusionsManagement />;
      case 'categories':
        return <CategoriesPanel />;
      case 'mappings':
        return <SourceMappingsPanel />;
      case 'quality':
        return <DataQualityPanel />;
      case 'coverage':
        return <SharadarCoveragePanel />;
      case 'logs':
        return <IngestionLogsPanel />;
      default:
        return <ExclusionsDashboard />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🔍 Exclusions Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and analyze investment exclusions data
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderActivePanel()}
      </div>
    </div>
  );
};

export default Exclusions;