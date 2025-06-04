import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Correctly import types when verbatimModuleSyntax is true
import { createClient, SupabaseClient, type User, type Session } from '@supabase/supabase-js';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Interests from './pages/Interests';
import Account from './pages/Account';
import Quotes from './pages/Quotes';
import Auth from './pages/Auth';

import './App.css'; // Import App.css for layout styles

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = "Supabase URL or Anon Key is missing. Check your frontend .env file (e.g., VITE_SUPABASE_URL=your_url).";
  console.error(errorMsg);
}

const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export const SupabaseContext = createContext<SupabaseClient>(supabase);

interface AppContextType {
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
    return (
      <div className="loadingScreen"> {/* Use class from App.css */}
        Loading...
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={supabase}>
      <AppContext.Provider value={{ user, session, supabase, loading }}>
        <Router>
          <div className="appContainer"> {/* Use class from App.css */}
            <Sidebar />
            <div className="mainContentWrapper"> {/* Use class from App.css */}
              <Navbar />
              <main className="pageContent"> {/* Use class from App.css */}
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
                  <Route path="/quotes" element={user ? <Quotes user={user} /> : <Navigate to="/auth" />} />
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
