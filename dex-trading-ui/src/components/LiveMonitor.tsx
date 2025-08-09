import React from 'react';

const LiveMonitor: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Live Monitor</h2>
      <ul>
        <li>Balance: 10 ETH</li>
        <li>Open Positions: 2</li>
        <li>Recent Trades: Buy 1 ETH @ $1,800</li>
      </ul>
    </div>
  );
};

export default LiveMonitor;
