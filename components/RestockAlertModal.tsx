import React, { useMemo } from 'react';
import { MainCategory } from '../types';

interface RestockAlertModalProps {
  inventory: MainCategory[];
  onClose: () => void;
}

const RESTOCK_THRESHOLD = 10;

const RestockAlertModal: React.FC<RestockAlertModalProps> = ({ inventory, onClose }) => {

  const lowStockSubCategories = useMemo(() => {
    return inventory
      .flatMap(cat => 
        cat.subCategories.map(sub => ({
          ...sub,
          availableStock: sub.items.filter(i => i.status === 'available').length,
          categoryName: cat.name,
        }))
      )
      .filter(sub => sub.availableStock <= RESTOCK_THRESHOLD)
      .sort((a, b) => a.availableStock - b.availableStock);
  }, [inventory]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400">Restock Alerts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>
        <main className="p-6 overflow-y-auto">
          {lowStockSubCategories.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-center">Remaining Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockSubCategories.map(sub => (
                  <tr key={sub.id} className="border-t border-gray-600">
                    <td className="p-2 font-semibold">{sub.name}</td>
                    <td className="p-2 text-gray-300">{sub.categoryName}</td>
                    <td className="p-2 text-center font-bold text-red-500">{sub.availableStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10">
                <p className="text-lg text-gray-400">All products are well-stocked.</p>
                <p className="text-sm text-gray-500">(Products with stock less than or equal to {RESTOCK_THRESHOLD} will appear here)</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RestockAlertModal;
