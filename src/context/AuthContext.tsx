import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  updateName: (name: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('user_name');
    if (savedName) {
      setUser({ id: 1, name: savedName, email: 'user@example.com' });
    }
    setLoading(false);
  }, []);

  const updateName = (name: string) => {
    localStorage.setItem('user_name', name);
    setUser({ id: 1, name, email: 'user@example.com' });
  };

  return (
    <AuthContext.Provider value={{ user, updateName, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
