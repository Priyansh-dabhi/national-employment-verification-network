import React from 'react';
import { DashboardProvider } from './store/DashboardContext';
import MainDashboard from './components/layout/MainDashboard';
import TopologyMap from './components/network/TopologyMap';
import SystemLogPanel from './components/terminal/SystemLogPanel';
import AssemblyLineTracker from './components/employment/AssemblyLineTracker';
import LedgerRecordsPanel from './components/ledger/LedgerRecordsPanel';

function App() {
  return (
    <DashboardProvider>
      <MainDashboard>
        <div className="flex flex-col h-full space-y-6">
          {/* Top: Network Topology */}
          <div className="flex-none pt-4 pb-2 border-b border-borderGlow/20">
            <TopologyMap />
          </div>

          {/* Middle: Assembly Line & Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[300px]">
            <div className="lg:col-span-8 h-full min-h-0">
              <AssemblyLineTracker />
            </div>
            <div className="lg:col-span-4 h-full min-h-0">
              <SystemLogPanel />
            </div>
          </div>

          {/* Bottom: Blockchain Employment Registry */}
          <div className="flex-none">
            <LedgerRecordsPanel />
          </div>
        </div>
      </MainDashboard>
    </DashboardProvider>
  );
}

export default App;


