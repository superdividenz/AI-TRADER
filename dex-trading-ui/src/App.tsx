import React from 'react';
import Header from './components/Header';
import StrategySelector from './components/StrategySelector';
import LiveMonitor from './components/LiveMonitor';
import ManualTrade from './components/ManualTrade';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <StrategySelector />
        <LiveMonitor />
        <ManualTrade />
      </div>
    </div>
  );
};

export default App;
