import { useEffect, useState, useContext } from 'react';
import { AppContext } from '../App';
import styles from './Home.module.css';

interface DailyQuote {
  quote: string;
  author: string;
}

const Home = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const session = appContext?.session;
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      setLoadingQuote(true);
      setQuoteError(null);
      
      if (appContext?.loading && !session) {
        setLoadingQuote(false);
        return;
      }

      try {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const response = await fetch(`/api/daily-quote`, { headers });
        if (!response.ok) {
          let errorDetail = `Failed to fetch quote: ${response.status}`;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) { /* Ignore */ }
          throw new Error(errorDetail);
        }
        const data: DailyQuote = await response.json();
        setDailyQuote(data);
      } catch (error: any) {
        setQuoteError(error.message || "Could not load daily quote.");
      } finally {
        setLoadingQuote(false);
      }
    };
    fetchDailyQuote();
  }, [session, appContext?.loading]);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.welcomeBox}>
        <h2 className={styles.title}>Welcome {user ? user.email : 'to The Dentist of Quotes'}!</h2>
        <p className={styles.subtitle}>Get your daily dose of inspiration!</p>
        {loadingQuote && <div className={styles.quoteLoading}><p>Loading your quote...</p></div>}
        {quoteError && <p className={styles.quoteError}>Error: {quoteError}</p>}
        {!loadingQuote && dailyQuote && (
          <blockquote className={styles.quoteBlock}>
            <p className={styles.quoteText}>"{dailyQuote.quote}"</p>
            <cite className={styles.quoteAuthor}>- {dailyQuote.author || 'Unknown'}</cite>
          </blockquote>
        )}
        {!loadingQuote && !dailyQuote && !quoteError && <p className={styles.noQuote}>No quote available right now.</p>}
      </div>
    </div>
  );
};

export default Home;