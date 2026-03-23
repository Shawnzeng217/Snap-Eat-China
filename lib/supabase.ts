
import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase Debug - URL:", supabaseUrl);
console.log("Supabase Debug - Key exists:", !!supabaseAnonKey);

// Safe Client Creation
const createSafeClient = () => {
    if (supabaseUrl && supabaseAnonKey) {
        return createClient(supabaseUrl, supabaseAnonKey);
    }

    console.warn("Supabase is missing URL or Key. functionality will be limited.");
    
    // Return a Mock Client that mimics the needed interface but does nothing
    return {
        from: (table: string) => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => Promise.resolve({ data: [], error: null }),
            update: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: () => Promise.resolve({ error: null }),
            signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' } }),
            signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' } }),
        }
    } as any;
};

export const supabase = createSafeClient();

