import { useContext, useEffect } from 'react';
import { Auth as SupabaseAuthUI } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { SupabaseContext } from '../App';

const AuthPage = () => {
  const supabase = useContext(SupabaseContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) navigate('/');
    });

    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate('/');
    };
    checkInitialSession();

    return () => subscription?.unsubscribe();
  }, [supabase, navigate]);

  if (!supabase) {
    return <p>Loading authentication...</p>;
  }

  return (
    <div style={{ maxWidth: '420px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <SupabaseAuthUI
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']}
      />
    </div>
  );
};

export default AuthPage;
