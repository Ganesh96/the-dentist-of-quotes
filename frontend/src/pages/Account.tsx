import { useContext } from 'react';
import { SupabaseContext } from '../App';
import { type User } from '@supabase/supabase-js'; // Import User type

// Define an interface for the component's props
interface AccountProps {
  user: User; 
}

// Apply the interface to the component's props
const Account = ({ user }: AccountProps) => {
  const supabase = useContext(SupabaseContext);

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  if (!user) {
    return <p>Loading user information or not logged in...</p>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.5em', marginBottom: '1em' }}>Account Info</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>User ID:</strong> {user.id}</p>
      <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>

      <button
        onClick={handleLogout}
        style={{ marginTop: '1.5em', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px' }}
      >
        Log Out
      </button>
    </div>
  );
};

export default Account;
