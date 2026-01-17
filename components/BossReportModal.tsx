import React, { useState, useMemo } from 'react';
import { MainCategory } from '../types';
// FIX: Import GoogleGenAI according to guidelines.
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
      // FIX: Initialize GoogleGenAI according to guidelines.
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

      // FIX: Call generateContent according to guidelines.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // FIX: Extract text correctly from the response.
      setSummary(response.text);

    } catch (e) {
      console.error("Error generating summary:", e);
      setError("Failed to generate summary. Please ensure your API key is correctly configured.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-gray-200">Financial Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">KSH {reportData.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-red-400">KSH {reportData.totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Gross Profit</p>
                <p className="text-2xl font-bold text-blue-400">KSH {reportData.totalProfit.toFixed(2)}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-300 mb-3">Top 5 Selling Items (by Price)</h3>
            {reportData.topSellingItems.length > 0 ? (
                <ul className="space-y-2">
                    {reportData.topSellingItems.map(item => (
                        <li key={item.id} className="flex justify-between bg-gray-700/50 p-2 rounded">
                            <span>{item.name}</span>
                            <span className="font-semibold">KSH {item.sellingPrice.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No items sold yet.</p>
            )}
          </div>
          
          <div className="border-t border-gray-700 pt-4">
              <h3 className="text-xl font-semibold text-gray-300 mb-3">AI-Powered Summary</h3>
              <button onClick={generateSummary} disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full disabled:bg-purple-800 disabled:cursor-not-allowed">
                {isLoading ? 'Generating...' : 'Generate AI Summary'}
              </button>
              {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
              {summary && (
                <div className="bg-gray-900 mt-4 p-4 rounded-lg border border-gray-600 text-gray-300 whitespace-pre-wrap font-mono text-sm">
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
