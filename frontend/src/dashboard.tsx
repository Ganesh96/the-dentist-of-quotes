import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from './api';

interface ProfileData {
  interests: string[];
}

export default function Dashboard() {
  const [interests, setInterests] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    getProfile().then(data => {
      if (data && Array.isArray(data.interests)) {
        setInterests(data.interests);
      }
    }).catch(error => console.error("Dashboard fetch error:", error));
  }, []);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !interests.includes(trimmed)) {
      const updated = [...interests, trimmed];
      updateProfile(updated).then(() => setInterests(updated));
    }
    setInput('');
  };

  const handleRemove = (item: string) => {
    const updated = interests.filter(i => i !== item);
    updateProfile(updated).then(() => setInterests(updated));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Interests (Dashboard)</h2>
      <ul>
        {interests.map((item, i) => (
          <li key={i}>
            {item}
            <button onClick={() => handleRemove(item)} style={{ marginLeft: '0.5rem' }}>❌</button>
          </li>
        ))}
      </ul>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Add interest" />
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}
