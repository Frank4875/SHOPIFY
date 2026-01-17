
import React from 'react';
import { MainCategory } from '../types';

// FIX: Add type declaration for jspdf on window object to fix TypeScript error.
declare global {
  interface Window {
    jspdf: any;
  }
}

interface SalesRecordModalProps {
  inventory: MainCategory[];
  onClose: () => void;
}

const SalesRecordModal: React.FC<SalesRecordModalProps> = ({ inventory, onClose }) => {
  const soldItemsWithDetails = inventory
    .flatMap(cat => cat.subCategories.flatMap(sub => 
        sub.items
            .filter(item => item.status === 'sold' && item.soldDate)
            .map(item => ({
                ...item,
                name: sub.name,
                sellingPrice: sub.sellingPrice
            }))
    ));

  const salesByDate = soldItemsWithDetails.reduce((acc, item) => {
    const date = item.soldDate!;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof soldItemsWithDetails>);
  
  const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const handleDownloadPdf = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("Sales Record", 14, 16);
    let yPos = 22;
    
    sortedDates.forEach(date => {
        const items = salesByDate[date];
        const dailyTotal = items.reduce((sum, item) => sum + item.sellingPrice, 0);

        if (yPos > 260) { // Add new page if content overflows
            doc.addPage();
            yPos = 15;
        }

        doc.setFontSize(12);
        doc.text(`Date: ${date} - Daily Total: KSH ${dailyTotal.toFixed(2)}`, 14, yPos);
        yPos += 6;
        
        doc.autoTable({
            startY: yPos,
            head: [['Item Name', 'Price']],
            body: items.map(item => [item.name, `KSH ${item.sellingPrice.toFixed(2)}`]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        yPos = doc.autoTable.previous.finalY + 10;
    });

    const grandTotal = soldItemsWithDetails.reduce((sum, item) => sum + item.sellingPrice, 0);
    if (yPos > 270) {
        doc.addPage();
        yPos = 15;
    }
    doc.setFontSize(14);
    doc.text(`Grand Total: KSH ${grandTotal.toFixed(2)}`, 14, yPos);
    
    doc.save('sales_record.pdf');
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        <header className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Sales Record</h2>
          <div className="flex gap-4">
             <button onClick={handleDownloadPdf} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-md">
                Download PDF
             </button>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-3xl transition-colors">&times;</button>
          </div>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          {sortedDates.length > 0 ? (
            sortedDates.map(date => {
              const itemsOnDate = salesByDate[date];
              const dailyTotal = itemsOnDate.reduce((sum, item) => sum + item.sellingPrice, 0);
              return (
                <div key={date} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between items-baseline mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">Daily Total: KSH {dailyTotal.toLocaleString()}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="pb-2 font-medium">Item Name</th>
                          <th className="pb-2 text-right font-medium">Selling Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {itemsOnDate.map(item => (
                          <tr key={item.id}>
                            <td className="py-2 text-gray-600 dark:text-gray-300">{item.name} #{item.itemNumber}</td>
                            <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">KSH {item.sellingPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400 py-10">No sales have been recorded yet.</p>
          )}
        </main>
        <footer className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-right">
                Grand Total: <span className="text-green-600 dark:text-green-400">KSH {soldItemsWithDetails.reduce((sum, item) => sum + item.sellingPrice, 0).toLocaleString()}</span>
            </p>
        </footer>
      </div>
    </div>
  );
};

export default SalesRecordModal;
