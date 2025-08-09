const fs = require('fs');
const path = require('path');

const components = {
  'App.tsx': `
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
`,

  'components/Header.tsx': `
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 p-4 text-xl font-bold">
      DEX Trading Dashboard
    </header>
  );
};

export default Header;
`,

  'components/StrategySelector.tsx': `
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
`,

  'components/LiveMonitor.tsx': `
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
`,

  'components/ManualTrade.tsx': `
import React, { useState } from 'react';

const ManualTrade: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('buy');

  const handleTrade = () => {
    alert(\`Placing \${side} order for \${amount}\`);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Manual Trade</h2>
      <select value={side} onChange={e => setSide(e.target.value)} className="w-full p-2 mb-2 rounded bg-gray-700">
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-full p-2 mb-2 rounded bg-gray-700"
      />
      <button onClick={handleTrade} className="bg-green-600 px-4 py-2 rounded">Submit Order</button>
    </div>
  );
};

export default ManualTrade;
`,
};

// Create files
Object.entries(components).forEach(([file, content]) => {
  const filePath = path.join('src', file);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content.trimStart(), 'utf8');
  console.log(`✅ Created ${filePath}`);
});

console.log('\nAll files created successfully!');
