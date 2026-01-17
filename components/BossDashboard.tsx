import React, { useState, useMemo } from 'react';
import { MainCategory, SubCategory } from '../types';
import SalesRecordModal from './SalesRecordModal';
import BossReportModal from './BossReportModal';
import RestockAlertModal from './RestockAlertModal';
import { supabase } from '../lib/supabaseClient';

interface BossDashboardProps {
  inventory: MainCategory[];
  onLogout: () => void;
  refreshInventory: () => void;
}

const BossDashboard: React.FC<BossDashboardProps> = ({ inventory, onLogout, refreshInventory }) => {
  const [showSalesRecord, setShowSalesRecord] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State for adding entities
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingSubCategoryTo, setAddingSubCategoryTo] = useState<string | null>(null);
  const [newSubCategory, setNewSubCategory] = useState({ name: '', buyingPrice: '0', sellingPrice: '0' });
  const [addingStockTo, setAddingStockTo] = useState<{ mainCatId: string; subCatId: string } | null>(null);
  const [stockQuantity, setStockQuantity] = useState('1');

  // State for editing entities
  const [editingEntity, setEditingEntity] = useState<{ type: 'category' | 'subcategory'; id: string; data: any } | null>(null);

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

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('main_categories').insert({ name: newCategoryName, user_id: user.id });
    if (!error) {
      setNewCategoryName('');
      refreshInventory();
    } else {
      console.error(error);
    }
  };

  const handleAddSubCategory = async (mainCatId: string) => {
    if (newSubCategory.name.trim() === '') return;
    const { error } = await supabase.from('sub_categories').insert({
      main_category_id: mainCatId,
      name: newSubCategory.name,
      buying_price: parseFloat(newSubCategory.buyingPrice) || 0,
      selling_price: parseFloat(newSubCategory.sellingPrice) || 0,
    });
    if (!error) {
      setNewSubCategory({ name: '', buyingPrice: '0', sellingPrice: '0' });
      setAddingSubCategoryTo(null);
      refreshInventory();
    } else {
      console.error(error);
    }
  };
  
  const handleAddStock = async () => {
    if (!addingStockTo) return;
    const quantity = parseInt(stockQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    const { data: existingItems, error: fetchError } = await supabase
      .from('items')
      .select('item_number')
      .eq('sub_category_id', addingStockTo.subCatId);
    
    if (fetchError) {
      console.error(fetchError);
      return;
    }

    const existingItemsCount = existingItems?.length || 0;
    const newItems = Array.from({ length: quantity }, (_, i) => ({
        sub_category_id: addingStockTo.subCatId,
        item_number: existingItemsCount + i + 1,
        status: 'available',
    }));

    const { error } = await supabase.from('items').insert(newItems);

    if (!error) {
      setStockQuantity('1');
      setAddingStockTo(null);
      refreshInventory();
    } else {
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId: string, subCatId: string) => {
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (!error) {
      // Re-number remaining items
      const { data: remainingItems, error: fetchError } = await supabase
        .from('items')
        .select('id, item_number')
        .eq('sub_category_id', subCatId)
        .order('item_number', { ascending: true });
      
      if(fetchError) { console.error(fetchError); return; }

      const updates = remainingItems.map((item, index) => 
        supabase.from('items').update({ item_number: index + 1 }).eq('id', item.id)
      );
      
      await Promise.all(updates);
      refreshInventory();
    } else {
      console.error(error);
    }
  };
  
  const handleRevertSale = async (itemId: string) => {
      const { error } = await supabase.from('items').update({ status: 'available', sold_date: null }).eq('id', itemId);
      if(!error) refreshInventory();
      else console.error(error);
  }

  const handleStartEdit = (type: 'category' | 'subcategory', entity: MainCategory | SubCategory) => {
    setEditingEntity({ type, id: entity.id, data: { ...entity } });
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEntity) return;
    const { name, value } = e.target;
    setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, [name]: value }});
  };

  const handleSaveEdit = async () => {
    if (!editingEntity) return;
    const { type, id, data } = editingEntity;

    if (type === 'category') {
        const { error } = await supabase.from('main_categories').update({ name: data.name }).eq('id', id);
        if(error) console.error(error);
    }
    if (type === 'subcategory') {
        const { error } = await supabase.from('sub_categories').update({ 
            name: data.name, 
            buying_price: parseFloat(data.buyingPrice) || 0, 
            selling_price: parseFloat(data.sellingPrice) || 0 
        }).eq('id', id);
        if(error) console.error(error);
    }
    setEditingEntity(null);
    refreshInventory();
  };

  const handleInviteWorker = async () => {
      if (!newInviteEmail.trim()) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setInviteMessage('');
      const { error } = await supabase.from('invites').insert({
          boss_id: user.id,
          worker_email: newInviteEmail.toLowerCase().trim()
      });

      if (error) {
          setInviteMessage(`Error: ${error.message}`);
      } else {
          setInviteMessage(`Invitation sent to ${newInviteEmail}! They can now sign up.`);
          setNewInviteEmail('');
      }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-bold text-green-400">Boss Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowSalesRecord(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">View Sales</button>
          <button onClick={() => setShowReport(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Financial Report</button>
          <button onClick={() => setShowRestock(true)} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Restock Alerts</button>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Logout</button>
        </div>
      </header>

      {showSalesRecord && <SalesRecordModal inventory={inventory} onClose={() => setShowSalesRecord(false)} />}
      {showReport && <BossReportModal inventory={inventory} onClose={() => setShowReport(false)} />}
      {showRestock && <RestockAlertModal inventory={inventory} onClose={() => setShowRestock(false)} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-200 mb-2">Add New Main Category</h2>
          <div className="flex gap-2">
              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name" className="bg-gray-700 text-white rounded p-2 flex-grow"/>
              <button onClick={handleAddCategory} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Add</button>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-200 mb-2">Invite a Worker</h2>
          <div className="flex gap-2">
              <input type="email" value={newInviteEmail} onChange={(e) => setNewInviteEmail(e.target.value)} placeholder="Worker's Email" className="bg-gray-700 text-white rounded p-2 flex-grow"/>
              <button onClick={handleInviteWorker} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Invite</button>
          </div>
          {inviteMessage && <p className="text-sm text-gray-400 mt-2">{inviteMessage}</p>}
        </div>
      </div>

      <div className="mb-6">
        <input
            type="text"
            placeholder="Search by category or sub-category name..."
            className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {filteredInventory.length > 0 ? (
          filteredInventory.map(cat => (
            <div key={cat.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4 gap-2">
                {editingEntity?.type === 'category' && editingEntity.id === cat.id ? (
                  <div className="flex-grow flex gap-2 items-center">
                     <input type="text" name="name" value={editingEntity.data.name} onChange={handleEditChange} className="bg-gray-700 text-white rounded p-2 flex-grow text-2xl font-bold"/>
                     <button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-md text-xs">Save</button>
                     <button onClick={() => setEditingEntity(null)} className="bg-gray-500 hover:bg-gray-400 text-white py-1 px-3 rounded-md text-xs">Cancel</button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-200">{cat.name}</h2>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => handleStartEdit('category', cat)} className="text-gray-400 hover:text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg></button>
                      <button onClick={() => setAddingSubCategoryTo(cat.id)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors">Add Sub-Category</button>
                    </div>
                  </>
                )}
              </div>
              
              {addingSubCategoryTo === cat.id && (
                   <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 p-2 pl-4 border-l-2 border-gray-600">
                      <input value={newSubCategory.name} onChange={e => setNewSubCategory({...newSubCategory, name: e.target.value})} placeholder="Sub-Category Name" className="md:col-span-2 bg-gray-700 rounded p-2 text-sm"/>
                      <input type="number" value={newSubCategory.buyingPrice} onChange={e => setNewSubCategory({...newSubCategory, buyingPrice: e.target.value})} placeholder="Buy Price" className="bg-gray-700 rounded p-2 text-sm"/>
                      <input type="number" value={newSubCategory.sellingPrice} onChange={e => setNewSubCategory({...newSubCategory, sellingPrice: e.target.value})} placeholder="Sell Price" className="bg-gray-700 rounded p-2 text-sm"/>
                      <div className="flex gap-2">
                          <button onClick={() => handleAddSubCategory(cat.id)} className="bg-green-600 w-full hover:bg-green-500 text-white font-bold py-2 px-3 rounded-md">Add</button>
                          <button onClick={() => setAddingSubCategoryTo(null)} className="bg-gray-500 w-full hover:bg-gray-400 text-white py-2 px-3 rounded-md">Cancel</button>
                      </div>
                  </div>
              )}

              <div className="pl-4 border-l-2 border-gray-600 space-y-4">
                {cat.subCategories.map(sub => (
                  <div key={sub.id} className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
                        {editingEntity?.type === 'subcategory' && editingEntity.id === sub.id ? (
                          <div className="flex-grow flex gap-2 items-center">
                             <input type="text" name="name" value={editingEntity.data.name} onChange={handleEditChange} className="bg-gray-600 text-white rounded p-1 flex-grow text-xl font-semibold"/>
                             <input type="number" name="buyingPrice" value={editingEntity.data.buyingPrice} onChange={handleEditChange} className="bg-gray-600 w-24 rounded p-1 text-sm text-right"/>
                             <input type="number" name="sellingPrice" value={editingEntity.data.sellingPrice} onChange={handleEditChange} className="bg-gray-600 w-24 rounded p-1 text-sm text-right"/>
                             <button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-md text-xs">Save</button>
                             <button onClick={() => setEditingEntity(null)} className="bg-gray-500 hover:bg-gray-400 text-white py-1 px-3 rounded-md text-xs">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-xl font-semibold text-gray-300">{sub.name}</h3>
                            <div className="flex gap-2 items-center">
                               <button onClick={() => handleStartEdit('subcategory', sub)} className="text-gray-400 hover:text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg></button>
                              <button onClick={() => setAddingStockTo({ mainCatId: cat.id, subCatId: sub.id })} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors">Add Stock</button>
                            </div>
                          </>
                        )}
                      </div>

                      {addingStockTo?.subCatId === sub.id && (
                          <div className="flex gap-2 mb-4 p-2 border border-gray-600 rounded-lg">
                              <input type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="Quantity to add" className="bg-gray-600 rounded p-1 text-sm flex-grow"/>
                              <button onClick={handleAddStock} className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-md text-sm">Add</button>
                              <button onClick={() => setAddingStockTo(null)} className="bg-gray-500 hover:bg-gray-400 text-white py-1 px-3 rounded-md text-sm">Cancel</button>
                          </div>
                      )}
                  
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-gray-400">
                            <tr>
                              <th className="p-2 w-8">#</th>
                              <th className="p-2 text-right">Buy Price</th>
                              <th className="p-2 text-right">Sell Price</th>
                              <th className="p-2 text-center">Status</th>
                              <th className="p-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sub.items.map(item => (
                              <tr key={item.id} className="border-t border-gray-600">
                                <td className="p-2 text-gray-400">{item.itemNumber}</td>
                                <td className="p-2 text-right">KSH {sub.buyingPrice.toFixed(2)}</td>
                                <td className="p-2 text-right">KSH {sub.sellingPrice.toFixed(2)}</td>
                                <td className="p-2 text-center">
                                  {item.status === 'sold' 
                                    ? <span className="text-red-400 font-semibold text-xs uppercase select-none">Sold</span>
                                    : <span className="text-green-400 font-semibold text-xs uppercase select-none">Available</span>
                                  }
                                </td>
                                <td className="p-2 text-center flex justify-center gap-2">
                                  {item.status === 'sold' && (
                                      <button onClick={() => handleRevertSale(item.id)} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-1 px-2 rounded-md text-xs">Revert</button>
                                  )}
                                  <button onClick={() => handleDeleteItem(item.id, sub.id)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 text-xl mt-10">
            {inventory.length > 0
              ? `No results found for "${searchQuery}".`
              : 'Your inventory is empty. Start by adding a main category.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default BossDashboard;