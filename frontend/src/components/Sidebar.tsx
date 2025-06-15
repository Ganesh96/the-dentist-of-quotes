import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const location = useLocation();
  const getLinkClassName = (path: string) => {
    return location.pathname === path
      ? `${styles.navLink} ${styles.active}`
      : styles.navLink;
  };

  return (
    <div className={styles.sidebar}>
      <h1 className={styles.logo}>QuoteApp</h1>
      <nav className={styles.nav}>
        <Link to="/" className={getLinkClassName('/')}>Home</Link>
        <Link to="/quotes" className={getLinkClassName('/quotes')}>My Quotes</Link>
        <Link to="/interests" className={getLinkClassName('/interests')}>My Interests</Link>
      </nav>
      <div className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Dentist of Quotes</p>
      </div>
    </div>
  );
};

export default Sidebar;
