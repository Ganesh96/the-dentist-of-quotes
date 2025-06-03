// File: frontend/src/components/Navbar.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  user: any;
}

function Navbar({ user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = await import('@supabase/supabase-js').then(m =>
      m.createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    );
    await supabase.auth.signOut();
    window.location.reload(); // force logout update
  };

  return (
    <div className="flex justify-end items-center p-4 bg-gray-100 shadow">
      <div className="relative">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
          <img
            src="https://api.iconify.design/mdi:account-circle.svg?color=%23000&width=32"
            alt="profile"
            className="w-8 h-8"
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md">
            {user ? (
              <>
                <Link to="/account" className="block px-4 py-2 hover:bg-gray-100">Account</Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/auth" className="block px-4 py-2 hover:bg-gray-100">
                Login / Register
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
