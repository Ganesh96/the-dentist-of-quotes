import { useContext, useEffect, useState } from 'react';
import { SupabaseContext } from '../App';
import { type User } from '@supabase/supabase-js';

interface Quote {
  id: string;
  text: string; // Your DB schema uses 'text' for the quote content
  author: string;
  user_id?: string;
  created_at?: string;
  category?: string;
}

interface QuotesProps {
  user: User | null;
}

const QuotesPage = ({ user }: QuotesProps) => {
  const supabase = useContext(SupabaseContext);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteCategory, setNewQuoteCategory] = useState('general');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableCategories = ['general', 'stoic', 'philosophy', 'wisdom', 'life', 'sports', 'technology', 'inspiration'];

  useEffect(() => {
    if (!user || !supabase) {
      setQuotes([]);
      return;
    }
    const fetchQuotes = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Ensure user_id column exists in your quotes table for this query to work
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setQuotes(data || []);
      } catch (e: any) {
        setErrorMessage(`Failed to fetch quotes: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotes();
  }, [user, supabase]);

  const addQuote = async () => {
    if (!newQuoteText.trim() || !user || !supabase) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { data: newQuote, error } = await supabase
        .from('quotes')
        .insert([{ user_id: user.id, text: newQuoteText, category: newQuoteCategory.toLowerCase() }])
        .select().single();
      if (error) throw error;
      if (newQuote) setQuotes(prev => [newQuote, ...prev]);
      setSuccessMessage("Quote added!");
      setNewQuoteText('');
      setNewQuoteCategory('general');
    } catch (e: any) {
      setErrorMessage(`Failed to add quote: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <p>Please log in.</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <h2>Your Quotes</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #ccc' }}>
        <h3>Add New Quote</h3>
        <textarea value={newQuoteText} onChange={(e) => setNewQuoteText(e.target.value)} placeholder="Quote text..." disabled={isLoading} style={{ width: '100%' }} />
        <select value={newQuoteCategory} onChange={(e) => setNewQuoteCategory(e.target.value)} disabled={isLoading} style={{ width: '100%', margin: '0.5rem 0' }}>
          {availableCategories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
        </select>
        <button onClick={addQuote} disabled={isLoading}>{isLoading ? 'Adding...' : 'Add Quote'}</button>
      </div>
      {isLoading && !quotes.length && <p>Loading quotes...</p>}
      {!isLoading && !quotes.length && <p>No quotes added yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {quotes.map((q) => (
          <li key={q.id} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '0.5rem' }}>
            <p>"{q.text}"</p>
            {q.category && <p><small>Category: {q.category}</small></p>}
            {q.created_at && <p><small>Added: {new Date(q.created_at).toLocaleString()}</small></p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuotesPage;
