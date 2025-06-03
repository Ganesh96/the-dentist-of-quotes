import { useEffect, useState, useContext } from 'react';
import { SupabaseContext } from '../App';

const INTEREST_OPTIONS = ['stoic', 'sports', 'general'];

const Interests = ({ user }) => {
  const supabase = useContext(SupabaseContext);

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');

  // Fetch interests from 'profiles' and 'interests'
  useEffect(() => {
    if (!user) return;

    const fetchAllInterests = async () => {
      // Fetch selected checkboxes from 'profiles'
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      if (profileData?.interests) setSelected(profileData.interests);

      // Fetch free-form interests from 'interests' table
      const { data: interestData, error: interestError } = await supabase
        .from('interests')
        .select('name')
        .eq('user_id', user.id);

      if (interestError) console.error(interestError);
      else setInterests(interestData.map((item: any) => item.name));

      setLoading(false);
    };

    fetchAllInterests();
  }, [user, supabase]);

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const saveInterests = async () => {
    await supabase
      .from('profiles')
      .update({ interests: selected })
      .eq('id', user.id);
    alert('Interests saved!');
  };

  const addInterest = async () => {
    if (!newInterest.trim()) return;
    const { error } = await supabase
      .from('interests')
      .insert([{ user_id: user.id, name: newInterest }]);

    if (error) {
      console.error(error);
    } else {
      setInterests([...interests, newInterest]);
      setNewInterest('');
    }
  };

  if (!user) return <p>Please log in to view interests.</p>;
  if (loading) return <p>Loading interests...</p>;

  return (
    <div>
      <h2 className="text-xl mb-4 font-bold">Select Your Interests</h2>
      <div className="space-y-2">
        {INTEREST_OPTIONS.map((option) => (
          <label key={option} className="block">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleInterest(option)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      <button
        onClick={saveInterests}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save
      </button>

      <h2 className="text-lg font-semibold mt-6">Your Added Interests</h2>
      <ul className="list-disc list-inside">
        {interests.map((interest, idx) => (
          <li key={idx}>{interest}</li>
        ))}
      </ul>

      <div className="mt-4">
        <input
          type="text"
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          placeholder="Add new interest"
          className="border px-2 py-1 mr-2"
        />
        <button
          onClick={addInterest}
          className="px-4 py-1 bg-green-600 text-white rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default Interests;
