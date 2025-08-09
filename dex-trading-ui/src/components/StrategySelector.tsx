import React from 'react';

const StrategySelector: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Strategy Selector</h2>
      <select className="w-full p-2 rounded bg-gray-700 text-white">
        <option>Scalping Bot</option>
        <option>Mean Reversion</option>
        <option>Momentum</option>
      </select>
      <button className="mt-2 bg-blue-600 px-4 py-2 rounded">Load Strategy</button>
    </div>
  );
};

export default StrategySelector;
