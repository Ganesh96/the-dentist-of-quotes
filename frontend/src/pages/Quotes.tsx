import { useContext, useEffect, useState } from 'react';
import { SupabaseContext } from '../App'; // Ensure this path is correct for your project structure

// Define a type for your quote objects for better type safety
interface Quote {
  id?: string; // Assuming quotes might have an ID from the database
  quote: string;
  user_id?: string;
  created_at?: string;
  // Add any other properties your quote object might have
}

const Quotes = ({ user }) => {
  const supabase = useContext(SupabaseContext);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newQuote, setNewQuote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setQuotes([]); // Clear quotes if user logs out
      return;
    }

    const fetchQuotes = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Fetch quotes error:', error);
          setErrorMessage(`Failed to fetch quotes: ${error.message}`);
        } else {
          setQuotes(data || []); // Ensure data is not null
        }
      } catch (e) {
        console.error('Unexpected fetch quotes error:', e);
        setErrorMessage('An unexpected error occurred while fetching quotes.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
  }, [user, supabase]);

  const addQuote = async () => {
    if (!newQuote.trim()) {
      setErrorMessage('Quote cannot be empty.');
      return;
    }
    if (!user) {
      setErrorMessage('You must be logged in to add a quote.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Supabase insert returns an object with `data` and `error`
      // The `data` will be an array of the inserted rows
      const { data: insertedData, error } = await supabase
        .from('quotes')
        .insert([{ user_id: user.id, quote: newQuote }])
        .select(); // Use .select() to get the inserted row back, including its id and created_at

      if (error) {
        console.error('Add quote error:', error);
        setErrorMessage(`Failed to add quote: ${error.message}`);
      } else {
        // Prepend the new quote returned from Supabase (which includes id, created_at)
        if (insertedData && insertedData.length > 0) {
          setQuotes(prevQuotes => [insertedData[0], ...prevQuotes]);
        } else {
          // Fallback if insertedData is not as expected, though .select() should return it
          // This optimistic update might lack DB-generated fields like 'id' or 'created_at'
          // but is better than nothing if the above fails.
          setQuotes(prevQuotes => [{ 
            quote: newQuote, 
            user_id: user.id, 
            created_at: new Date().toISOString() 
          }, ...prevQuotes]);
        }
        setNewQuote('');
      }
    } catch (e) {
      console.error('Unexpected add quote error:', e);
      setErrorMessage('An unexpected error occurred while adding the quote.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <p>Please log in to view and add your quotes.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Quotes</h2>

      {errorMessage && <p style={{ color: 'red', marginBottom: '1rem' }}>{errorMessage}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={newQuote}
          onChange={(e) => setNewQuote(e.target.value)}
          placeholder="Add a new quote"
          className="border p-2 w-full mb-2"
          disabled={isLoading}
        />
        <button
          onClick={addQuote}
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Add Quote'}
        </button>
      </div>

      {isLoading && quotes.length === 0 && <p>Loading your quotes...</p>}

      <ul className="mt-4 space-y-2">
        {quotes.map((q, idx) => (
          // It's better to use a unique ID from the database as a key if available
          <li key={q.id || idx} className="border p-2 rounded">
            <p>{q.quote}</p>
            {/* Optionally display created_at or other details */}
            {q.created_at && (
              <p style={{ fontSize: '0.8em', color: 'gray' }}>
                Added: {new Date(q.created_at).toLocaleString()}
              </p>
            )}
          </li>
        ))}
      </ul>
      {!isLoading && quotes.length === 0 && !errorMessage && (
        <p>You haven't added any quotes yet.</p>
      )}
    </div>
  );
};

export default Quotes;