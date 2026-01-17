
import React, { useState, useEffect } from 'react';
import { MainCategory, Profile } from './types';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import BossDashboard from './components/BossDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import ScrollToTop from './components/ScrollToTop';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inventory, setInventory] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchProfileAndInventory(session);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfileAndInventory(session);
        } else {
          setProfile(null);
          setInventory([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndInventory = async (currentSession: Session) => {
    if (!currentSession?.user) return;
    setLoading(true);
    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentSession.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      setProfile(null);
    } else {
      setProfile(profileData);
      // Fetch inventory based on role
      await fetchInventory(profileData);
    }
    setLoading(false);
  };
  
  const fetchInventory = async (userProfile: Profile) => {
    // Boss query: fetches all their own data.
    // Worker query: fetches their boss's data, but crucially selects only the selling_price.
    const query = supabase
      .from('main_categories')
      .select(`
        id,
        name,
        subCategories:sub_categories (
          id,
          name,
          ${userProfile.role === 'boss' ? 'buyingPrice:buying_price,' : ''}
          sellingPrice:selling_price,
          items (
            id,
            itemNumber:item_number,
            status,
            soldDate:sold_date
          )
        )
      `)
      .order('name', { ascending: true })
      .order('item_number', { referencedTable: 'sub_categories.items', ascending: true });
      
    if (userProfile.role === 'worker') {
        const { data: bossProfile, error } = await supabase.from('profiles').select('boss_id').eq('id', userProfile.id).single();
        if(error || !bossProfile) return;
        query.eq('user_id', bossProfile.boss_id);
    }

    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching inventory:', error);
    } else {
        // Map snake_case to camelCase
        const formattedData = data.map(cat => ({
            ...cat,
            subCategories: cat.subCategories.map(sub => ({
                ...sub,
                buyingPrice: sub.buyingPrice || 0, // Ensure buyingPrice exists for workers, even if 0
            }))
        }));
        setInventory(formattedData as unknown as MainCategory[]);
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setInventory([]);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <Auth />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {profile.role === 'boss' ? (
        <BossDashboard 
          inventory={inventory}
          onLogout={handleLogout}
          refreshInventory={() => fetchInventory(profile)}
        />
      ) : (
        <WorkerDashboard 
          inventory={inventory} 
          onLogout={handleLogout}
          refreshInventory={() => fetchInventory(profile)}
        />
      )}
      <ScrollToTop />
    </div>
  );
};

export default App;
