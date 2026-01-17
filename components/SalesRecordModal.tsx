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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-gray-200">Sales Record</h2>
          <div className="flex gap-4">
             <button onClick={handleDownloadPdf} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                Download PDF
             </button>
             <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          {sortedDates.length > 0 ? (
            sortedDates.map(date => {
              const itemsOnDate = salesByDate[date];
              const dailyTotal = itemsOnDate.reduce((sum, item) => sum + item.sellingPrice, 0);
              return (
                <div key={date} className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-xl font-semibold text-gray-300">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <p className="text-lg font-bold text-green-400">Daily Total: KSH {dailyTotal.toFixed(2)}</p>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-400">
                      <tr>
                        <th className="p-2">Item Name</th>
                        <th className="p-2 text-right">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsOnDate.map(item => (
                        <tr key={item.id} className="border-t border-gray-600">
                          <td className="p-2">{item.name} #{item.itemNumber}</td>
                          <td className="p-2 text-right">KSH {item.sellingPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400 py-10">No sales have been recorded yet.</p>
          )}
        </main>
        <footer className="p-4 border-t border-gray-700 text-right">
            <p className="text-xl font-bold text-gray-200">
                Grand Total: <span className="text-green-300">KSH {soldItemsWithDetails.reduce((sum, item) => sum + item.sellingPrice, 0).toFixed(2)}</span>
            </p>
        </footer>
      </div>
    </div>
  );
};

export default SalesRecordModal;
