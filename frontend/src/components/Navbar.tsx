import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App'; // Assuming AppContext is exported from App.tsx
import styles from './Navbar.module.css'; // Import CSS Module

const Navbar = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const supabase = appContext?.supabase;
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    } else {
      setDropdownOpen(false);
      navigate('/auth');
    }
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.appName}>
          {/* Optional: You can put an app name or leave it empty if sidebar has it */}
          {/* <Link to="/">The Dentist of Quotes</Link> */}
        </div>
        <div className={styles.navMenu}>
          {user ? (
            <div className={styles.dropdown}>
              <button onClick={toggleDropdown} className={styles.dropdownToggle}>
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </button>
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <p>Signed in as</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setDropdownOpen(false)}
                    className={styles.dropdownItem}
                  >
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`${styles.dropdownItem} ${styles.dropdownButton}`}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className={styles.navLink}>
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
