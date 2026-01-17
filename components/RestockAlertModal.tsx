
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        <header className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Restock Alerts
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-3xl transition-colors">&times;</button>
        </header>
        <main className="p-6 overflow-y-auto">
          {lowStockSubCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="pb-4 font-bold uppercase tracking-wider text-xs">Product Name</th>
                    <th className="pb-4 font-bold uppercase tracking-wider text-xs">Category</th>
                    <th className="pb-4 text-center font-bold uppercase tracking-wider text-xs">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {lowStockSubCategories.map(sub => (
                    <tr key={sub.id}>
                      <td className="py-4 font-semibold text-gray-800 dark:text-gray-200">{sub.name}</td>
                      <td className="py-4 text-gray-500 dark:text-gray-400">{sub.categoryName}</td>
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.availableStock <= 3 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                          {sub.availableStock} remaining
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">All set!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All products are currently well-stocked.</p>
                <p className="text-xs text-gray-400 mt-4 italic">(Threshold: items with ≤ {RESTOCK_THRESHOLD} units)</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RestockAlertModal;
