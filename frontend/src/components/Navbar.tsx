import React, { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleClick = () => {
    if (user) navigate('/account');
    else navigate('/login'); // You can replace this with your auth flow or modal
  };

  return (
    <nav className={styles.navbar}>
      <h1 className={styles.logo}>🦷 The Dentist of Quotes</h1>
      <div className={styles.profile}>
        <button onClick={handleClick}>
          {user ? 'Account' : 'Login / Register'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
