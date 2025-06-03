import { useContext, useEffect, useState } from 'react';
import { SupabaseContext } from '../App';

const Quotes = ({ user }) => {
  const supabase = useContext(SupabaseContext);
  const [quotes, setQuotes] = useState([]);
  const [newQuote, setNewQuote] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchQuotes = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setQuotes(data);
    };

    fetchQuotes();
  }, [user]);

  const addQuote = async () => {
    if (!newQuote.trim()) return;
    const { error } = await supabase
      .from('quotes')
      .insert([{ user_id: user.id, quote: newQuote }]);

    if (error) console.error(error);
    else {
      setQuotes([{ quote: newQuote }, ...quotes]);
      setNewQuote('');
    }
  };

  if (!user) return <p>Please log in to view your quotes.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Quotes</h2>
      <input
        type="text"
        value={newQuote}
        onChange={(e) => setNewQuote(e.target.value)}
        placeholder="Add a new quote"
        className="border p-2 w-full mb-2"
      />
      <button
        onClick={addQuote}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Add Quote
      </button>

      <ul className="mt-4 space-y-2">
        {quotes.map((q, idx) => (
          <li key={idx} className="border p-2 rounded">
            {q.quote}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Quotes;
