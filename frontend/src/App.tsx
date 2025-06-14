import { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient, SupabaseClient, type User, type Session } from '@supabase/supabase-js';

import Sidebar from './components/Sidebar'; // Ensure file is named Sidebar.tsx
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Interests from './pages/Interests';
import Account from './pages/Account';
import QuotesPage from './pages/Quotes'; // Renamed from Quotes
import AuthPage from './pages/Auth';   // Renamed from Auth

import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check your .env file.");
}

const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export const SupabaseContext = createContext<SupabaseClient>(supabase);

export interface AppContextType {
  user: User | null;
  session: Session | null;
  supabase: SupabaseClient;
  loading: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error.message);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (e) {
        console.error("Exception in getSession:", e);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="loadingScreen">Loading...</div>;
  }

  return (
    <SupabaseContext.Provider value={supabase}>
      <AppContext.Provider value={{ user, session, supabase, loading }}>
        <Router>
          <div className="appContainer">
            <Sidebar />
            <div className="mainContentWrapper">
              <Navbar />
              <main className="pageContent">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
                  <Route path="/quotes" element={user ? <QuotesPage user={user} /> : <Navigate to="/auth" />} />
                  <Route path="/interests" element={user ? <Interests user={user} /> : <Navigate to="/auth" />} />
                  <Route path="/account" element={user ? <Account user={user} /> : <Navigate to="/auth" />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AppContext.Provider>
    </SupabaseContext.Provider>
  );
}

export default App;
