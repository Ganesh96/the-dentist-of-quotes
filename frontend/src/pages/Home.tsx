import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../App'; // Assuming AppContext is exported from App.tsx
import styles from './Home.module.css'; // Your CSS Module for Home page styles

interface DailyQuote {
  quote: string;
  author: string;
}

const Home = () => {
  const appContext = useContext(AppContext);
  const user = appContext?.user;
  const session = appContext?.session; // Get session from AppContext

  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyQuote = async () => {
      setLoadingQuote(true);
      setQuoteError(null);
      console.log("Home.tsx: Attempting to fetch daily quote.");
      if (appContext?.loading) {
        console.log("Home.tsx: App context is still loading, deferring quote fetch.");
        // Optionally, you could set a short timeout and retry, or rely on session change to re-trigger.
        // For now, if context is loading, we might not have the session yet.
        // The dependency array on `session` and `appContext?.loading` should handle re-fetching.
        setLoadingQuote(false); // Avoid infinite loading state if context never resolves here
        return;
      }

      try {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          console.log("Home.tsx: Sending request with Authorization header.");
        } else {
          console.log("Home.tsx: No active session or access token, sending request without Authorization header.");
        }

        const response = await fetch('http://localhost:8000/daily-quote', { headers });
        
        console.log(`Home.tsx: Daily quote response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          console.error("Home.tsx: Error fetching daily quote - Response not OK", errorData);
          throw new Error(errorData.detail || `Failed to fetch quote: ${response.status}`);
        }
        
        const data: DailyQuote = await response.json();
        console.log("Home.tsx: Daily quote data received:", data);
        setDailyQuote(data);

      } catch (error: any) {
        console.error("Home.tsx: Error fetching daily quote:", error);
        setQuoteError(error.message || "Could not load daily quote.");
      } finally {
        setLoadingQuote(false);
      }
    };

    // Fetch quote if app context is done loading.
    // The session dependency will re-trigger if the session changes (login/logout).
    if (!appContext?.loading) {
        fetchDailyQuote();
    } else {
        console.log("Home.tsx: App context still loading, fetchDailyQuote not called yet.");
    }
  }, [session, appContext?.loading]); // Re-fetch when session changes or app context loading state changes

  return (
    <div className={styles.homeContainer}>
      <div className={styles.welcomeBox}>
        <h2 className={styles.title}>
          Welcome {user ? user.email : 'to The Dentist of Quotes'}!
        </h2>
        <p className={styles.subtitle}>
          Get your daily dose of inspiration!
        </p>

        {loadingQuote && (
          <div className={styles.quoteLoading}>
            <p>Loading your quote...</p>
          </div>
        )}

        {quoteError && (
          <p className={styles.quoteError}>Error: {quoteError}</p>
        )}

        {!loadingQuote && dailyQuote && (
          <blockquote className={styles.quoteBlock}>
            <p className={styles.quoteText}>"{dailyQuote.quote}"</p>
            <cite className={styles.quoteAuthor}>
              - {dailyQuote.author || 'Unknown'}
            </cite>
          </blockquote>
        )}
         {!loadingQuote && !dailyQuote && !quoteError && (
          <p className={styles.noQuote}>No quote available at the moment. Try refreshing!</p>
        )}
      </div>
    </div>
  );
};

export default Home;
