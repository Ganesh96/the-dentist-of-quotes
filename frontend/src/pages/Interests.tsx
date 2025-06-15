import { useEffect, useState, useContext } from 'react';
import { SupabaseContext } from '../App';
import { type User } from '@supabase/supabase-js';

const INTEREST_OPTIONS = ['stoic', 'sports', 'general', 'philosophy', 'wisdom', 'life', 'technology'];

interface InterestsProps {
  user: User | null;
}

interface UserInterest {
  name: string;
}

const Interests = ({ user }: InterestsProps) => {
  const supabase = useContext(SupabaseContext);
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
  const [userAddedInterests, setUserAddedInterests] = useState<UserInterest[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    const fetchAllInterests = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data: profileData } = await supabase
          .from('profiles').select('interests').eq('id', user.id).single();
        if (profileData?.interests) setSelectedPredefined(profileData.interests);

        const { data: userInterestData } = await supabase
          .from('interests').select('name').eq('user_id', user.id);
        if (userInterestData) setUserAddedInterests(userInterestData as UserInterest[]);
      } catch (e: any) {
        setErrorMsg("An error occurred loading your interests.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllInterests();
  }, [user, supabase]);

  const savePredefinedInterests = async () => {
    if (!user || !supabase) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    const { error } = await supabase
      .from('profiles').update({ interests: selectedPredefined }).eq('id', user.id);
    if (error) setErrorMsg(`Save failed: ${error.message}`);
    else setSuccessMsg('Predefined interests saved!');
  };

  const handleAddUserInterest = async () => {
    if (!newInterestInput.trim() || !user || !supabase) return;
    const interestToAdd = newInterestInput.trim().toLowerCase();
    if (userAddedInterests.some(i => i.name.toLowerCase() === interestToAdd)) {
        setErrorMsg(`Interest "${interestToAdd}" already added.`);
        return;
    }
    const { data: newInterest, error } = await supabase
      .from('interests').insert([{ user_id: user.id, name: interestToAdd }]).select().single();
    if (error) setErrorMsg(`Failed to add interest: ${error.message}`);
    else if (newInterest) {
      setUserAddedInterests(prev => [...prev, newInterest as UserInterest]);
      setNewInterestInput('');
      setSuccessMsg(`Interest "${interestToAdd}" added!`);
    }
  };

  if (!user) return <p>Please log in to manage your interests.</p>;
  if (loading) return <p>Loading your interests...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2 style={{ fontSize: '1.5em', marginBottom: '20px' }}>Manage Your Interests</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.2em' }}>Predefined Interests</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {INTEREST_OPTIONS.map((option) => (
            <label key={option}>
              <input type="checkbox"
                checked={selectedPredefined.includes(option)}
                onChange={() => setSelectedPredefined(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option])}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}
        </div>
        <button onClick={savePredefinedInterests} style={{ marginTop: '15px' }}>Save Predefined</button>
      </section>
      <section>
        <h3 style={{ fontSize: '1.2em' }}>Your Custom Interests</h3>
        <ul>{userAddedInterests.map((interest, idx) => <li key={idx}>{interest.name}</li>)}</ul>
        <div>
          <input type="text" value={newInterestInput} onChange={(e) => setNewInterestInput(e.target.value)} placeholder="Add a new interest" />
          <button onClick={handleAddUserInterest}>Add Custom</button>
        </div>
      </section>
    </div>
  );
};

export default Interests;
