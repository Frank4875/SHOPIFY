import React, { useState, useMemo } from 'react';
import { MainCategory } from '../types';
import SalesRecordModal from './SalesRecordModal';
import { supabase } from '../lib/supabaseClient';

interface WorkerDashboardProps {
  inventory: MainCategory[];
  onLogout: () => void;
  refreshInventory: () => void;
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ inventory, onLogout, refreshInventory }) => {
  const [sellingState, setSellingState] = useState<{itemId: string | null, date: string}>({ itemId: null, date: '' });
  const [showRecords, setShowRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const minDate = yesterday.toISOString().split('T')[0];
  const maxDate = today.toISOString().split('T')[0];
  
  const filteredInventory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return inventory;
    }

    return inventory
      .map(category => {
        const categoryMatch = category.name.toLowerCase().includes(query);
        const matchingSubCategories = category.subCategories.filter(sub =>
          sub.name.toLowerCase().includes(query)
        );

        if (!categoryMatch && matchingSubCategories.length === 0) {
          return null;
        }

        return {
          ...category,
          subCategories: categoryMatch ? category.subCategories : matchingSubCategories,
        };
      })
      .filter((cat): cat is MainCategory => cat !== null);
  }, [inventory, searchQuery]);
  
  const handleSellClick = (itemId: string) => {
    setSellingState({ itemId, date: maxDate });
  };
  
  const handleConfirmSell = async (itemId: string) => {
    if (sellingState.date) {
      const { error } = await supabase
        .from('items')
        .update({ status: 'sold', sold_date: sellingState.date })
        .eq('id', itemId);
      
      if (!error) {
        refreshInventory();
      } else {
        console.error("Error selling item:", error);
      }
      setSellingState({ itemId: null, date: '' });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-400">Worker Dashboard</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowRecords(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            View Record
          </button>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Logout</button>
        </div>
      </header>
      
      {showRecords && <SalesRecordModal inventory={inventory} onClose={() => setShowRecords(false)} />}
      
      <div className="mb-6">
        <input
            type="text"
            placeholder="Search by category or sub-category name..."
            className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {filteredInventory.length > 0 ? (
          filteredInventory.map(cat => (
            <div key={cat.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h2 className="text-2xl font-bold text-gray-200 mb-4">{cat.name}</h2>
              <div className="pl-4 border-l-2 border-gray-600 space-y-4">
                {cat.subCategories.length > 0 ? cat.subCategories.map(sub => (
                  <div key={sub.id} className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-300 mb-3">{sub.name}</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-gray-400">
                            <tr>
                              <th className="p-2 w-8">#</th>
                              <th className="p-2 text-right">Selling Price</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sub.items.length > 0 ? sub.items.map(item => (
                              <tr key={item.id} className={`border-t border-gray-600 transition-opacity ${item.status === 'sold' ? 'opacity-50' : ''}`}>
                                <td className={`p-2 text-gray-400 ${item.status === 'sold' ? 'line-through' : ''}`}>{item.itemNumber}</td>
                                <td className={`p-2 text-right ${item.status === 'sold' ? 'line-through' : ''}`}>KSH {sub.sellingPrice.toFixed(2)}</td>
                                <td className="p-2 text-center">
                                  {item.status === 'available' ? (
                                    sellingState.itemId === item.id ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <input 
                                          type="date" 
                                          value={sellingState.date}
                                          min={minDate}
                                          max={maxDate}
                                          onChange={(e) => setSellingState({...sellingState, date: e.target.value})}
                                          className="bg-gray-600 rounded p-1 text-xs"
                                        />
                                        <button onClick={() => handleConfirmSell(item.id)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded-md text-xs">Confirm</button>
                                        <button onClick={() => setSellingState({itemId: null, date: ''})} className="bg-gray-500 hover:bg-gray-400 text-white py-1 px-2 rounded-md text-xs">X</button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleSellClick(item.id)}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors"
                                      >
                                        Sell
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-gray-400 font-semibold text-xs uppercase select-none">Sold</span>
                                  )}
                                </td>
                              </tr>
                            )) : (
                              <tr><td colSpan={3} className="text-center p-4 text-gray-500">No items in this sub-category.</td></tr>
                            )}
                          </tbody>
                        </table>
                     </div>
                  </div>
                )) : <p className="text-gray-500">No sub-categories found.</p>}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 text-xl mt-10">
            {inventory.length > 0
              ? `No results found for "${searchQuery}".`
              : 'Inventory is currently empty.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;