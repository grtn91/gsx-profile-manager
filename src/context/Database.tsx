import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '../lib/db';
import { DatabaseContextType } from './Database.types';

// Create the context with a default value
const initialDatabaseState = createContext<DatabaseContextType>({
  db: null,
  loading: true,
  error: null,
});

// Provider component
export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const database = await initDatabase();
        setDb(database);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError('Failed to initialize database. Please restart the application.');
      } finally {
        setLoading(false);
      }
    };

    setupDatabase();
  }, []);

  return (
    <initialDatabaseState.Provider value={{ db, loading, error }}>
      {children}
    </initialDatabaseState.Provider>
  );
};

// Custom hook to use the database
export const useDatabase = () => {
  const context = useContext(initialDatabaseState);

  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }

  return context;
};