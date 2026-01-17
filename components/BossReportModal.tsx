
import React, { useState, useMemo } from 'react';
import { MainCategory } from '../types';
import { GoogleGenAI } from "@google/genai";

interface BossReportModalProps {
  inventory: MainCategory[];
  onClose: () => void;
}

const BossReportModal: React.FC<BossReportModalProps> = ({ inventory, onClose }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reportData = useMemo(() => {
    const soldItemsWithDetails = inventory
        .flatMap(cat => cat.subCategories.flatMap(sub => 
            sub.items
                .filter(item => item.status === 'sold')
                .map(item => ({
                    ...item,
                    name: sub.name,
                    buyingPrice: sub.buyingPrice,
                    sellingPrice: sub.sellingPrice
                }))
        ));
    
    const totalRevenue = soldItemsWithDetails.reduce((sum, item) => sum + item.sellingPrice, 0);
    const totalCost = soldItemsWithDetails.reduce((sum, item) => sum + item.buyingPrice, 0);
    const totalProfit = totalRevenue - totalCost;

    const topSellingItems = [...soldItemsWithDetails]
      .sort((a, b) => b.sellingPrice - a.sellingPrice)
      .slice(0, 5);

    return { soldItems: soldItemsWithDetails, totalRevenue, totalCost, totalProfit, topSellingItems };
  }, [inventory]);

  const generateSummary = async () => {
    setIsLoading(true);
    setSummary('');
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the following sales data for my small shop in Kenya and provide a brief summary of business performance.
        - Total Revenue: KSH ${reportData.totalRevenue.toFixed(2)}
        - Total Cost of Goods Sold: KSH ${reportData.totalCost.toFixed(2)}
        - Gross Profit: KSH ${reportData.totalProfit.toFixed(2)}
        - Total items sold: ${reportData.soldItems.length}
        
        Provide one actionable insight for me to improve sales or profitability, based on this data.
        Keep the entire response concise and easy to read, under 150 words.
        Here is the list of sold items for context: ${JSON.stringify(reportData.soldItems.map(i => ({ name: i.name, profit: i.sellingPrice - i.buyingPrice })))}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setSummary(response.text || "No summary generated.");

    } catch (e) {
      console.error("Error generating summary:", e);
      setError("Failed to generate summary. Please ensure your API key is correctly configured.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        <header className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Financial Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-3xl transition-colors">&times;</button>
        </header>
        <main className="p-6 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Revenue</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">KSH {reportData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Cost</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">KSH {reportData.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Gross Profit</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">KSH {reportData.totalProfit.toLocaleString()}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Top 5 Selling Items
            </h3>
            {reportData.topSellingItems.length > 0 ? (
                <ul className="space-y-2">
                    {reportData.topSellingItems.map(item => (
                        <li key={item.id} className="flex justify-between bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                            <span className="font-bold text-gray-900 dark:text-white">KSH {item.sellingPrice.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-sm text-center py-4">No items sold yet.</p>
            )}
          </div>
          
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.535 5.354a1 1 0 001.415 0 3.5 3.5 0 014.24 0 1 1 0 101.415-1.415 5.5 5.5 0 00-7.07 0 1 1 0 000 1.415z" clipRule="evenodd" />
                  </svg>
                AI-Powered Summary
              </h3>
              <button onClick={generateSummary} disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95 w-full disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating...
                  </span>
                ) : 'Generate Performance Insight'}
              </button>
              {error && <p className="text-red-500 dark:text-red-400 mt-3 text-sm font-medium">{error}</p>}
              {summary && (
                <div className="bg-gray-50 dark:bg-gray-900/60 mt-4 p-5 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed italic shadow-inner">
                    {summary}
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BossReportModal;
