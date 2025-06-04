// File: frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Interests from './pages/Interests';
import Account from './pages/Account';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export const SupabaseContext = React.createContext(supabase);

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => setUser(data?.session?.user ?? null));
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={supabase}>
      <Router>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-col flex-grow">
            <Navbar user={user} />
            <main className="p-4 flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/interests" element={<Interests user={user} />} />
                <Route path="/quotes" element={<Quotes user={user} />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/account" element={user ? <Account user={user} /> : <Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </SupabaseContext.Provider>
  );
}

export default App;