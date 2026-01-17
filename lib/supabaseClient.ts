import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mjskyjphdopzjdtuztkb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qc2t5anBoZG9wempkdHV6dGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDc3NTMsImV4cCI6MjA3NTMyMzc1M30.p5e_D9o1Ie7QnGVoyQUYJo05wytil2yr6O_aAJTBcew';

// FIX: Use `window.supabase.createClient` to access the client from the global scope where the CDN loads it.
export const supabase = (window as any).supabase.createClient(supabaseUrl, supabaseAnonKey);
