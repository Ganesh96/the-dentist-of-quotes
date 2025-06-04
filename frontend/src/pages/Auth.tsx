// File: frontend/src/pages/Auth.tsx
import { useContext, useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom'; // To redirect after login
import { SupabaseContext } from '../App'; // Assuming your Supabase client is provided via context from App.tsx

const Auth = () => {
  const supabase = useContext(SupabaseContext);
  const navigate = useNavigate();

  // Check if supabase client is available from context
  if (!supabase) {
    return <p>Error: Supabase client not found. Please ensure it's provided in AppContext.</p>;
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // User is logged in, redirect to home or account page
        navigate('/'); // Or '/account' or any other desired page
      }
    });

    // Check initial session state as well
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/');
      }
    };
    checkInitialSession();


    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, navigate]);

  return (
    <div style={{ maxWidth: '420px', margin: '50px auto', padding: '20px' }}>
      {/* The SupabaseAuth component handles Login, Sign Up, Magic Link, Social Auth etc.
        You can customize it using `appearance`, `providers`, `socialLayout`, etc.
      */}
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }} // ThemeSupa provides a nice default look
        providers={['google', 'github']} // Optional: add social providers you've configured in Supabase
        // redirectTo="http://localhost:3000/account" // Optional: if you want to redirect after social login
        // view="sign_in" // Optional: to set the default view ('sign_in' or 'sign_up')
        // onlyThirdPartyProviders={false} // Optional: to show only social providers
      />
    </div>
  );
};

export default Auth;