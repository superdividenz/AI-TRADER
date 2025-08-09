import React, { useState } from 'react';

const ManualTrade: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('buy');

  const handleTrade = () => {
    alert(`Placing ${side} order for ${amount}`);
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
