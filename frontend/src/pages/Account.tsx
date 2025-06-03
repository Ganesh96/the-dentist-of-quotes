import { useContext } from 'react';
import { SupabaseContext } from '../App';

const Account = ({ user }) => {
  const supabase = useContext(SupabaseContext);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Account Info</h2>
      <p><strong>Email:</strong> {user.email}</p>

      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Log Out
      </button>
    </div>
  );
};

export default Account;
