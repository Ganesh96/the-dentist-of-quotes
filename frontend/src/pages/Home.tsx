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
  const session = appContext?.session; 

  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Use VITE_API_BASE_URL for deployed environment, fallback for local
  // If VITE_API_BASE_URL is not set, it will default to relative paths (good for same-domain Vercel deployment)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""; 

  useEffect(() => {
    const fetchDailyQuote = async () => {
      setLoadingQuote(true);
      setQuoteError(null);
      
      if (appContext?.loading && !session) { // Wait for initial auth check if loading
        console.log("Home.tsx: App context loading or no session yet, deferring quote fetch.");
        setLoadingQuote(false); 
        return;
      }

      try {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Use the /api prefix for backend calls
        const response = await fetch(`${API_BASE_URL}/api/daily-quote`, { headers });
        
        if (!response.ok) {
          let errorDetail = `Failed to fetch quote: ${response.status}`;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) { /* Ignore if response is not JSON */ }
          throw new Error(errorDetail);
        }
        
        const data: DailyQuote = await response.json();
        setDailyQuote(data);

      } catch (error: any) {
        console.error("Home.tsx: Error fetching daily quote:", error);
        setQuoteError(error.message || "Could not load daily quote.");
      } finally {
        setLoadingQuote(false);
      }
    };

    fetchDailyQuote();

  }, [session, appContext?.loading, API_BASE_URL]); // Add API_BASE_URL to dependencies

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
