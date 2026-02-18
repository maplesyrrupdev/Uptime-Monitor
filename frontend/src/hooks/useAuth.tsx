import { useState, useEffect, createContext, useContext } from 'react';
import api, { initCsrf } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSetupComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  markSetupComplete: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && !response.data.message) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    await initCsrf();
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const [setupResult, authResult] = await Promise.allSettled([
        api.get('/setup/status'),
        api.get('/auth/me'),
      ]);

      if (setupResult.status === 'fulfilled') {
        setIsSetupComplete(setupResult.value.data.setup_complete);
      } else {
        setIsSetupComplete(false);
      }

      if (authResult.status === 'fulfilled') {
        const data = authResult.value.data;
        if (data && !data.message) {
          setUser(data);
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const markSetupComplete = () => setIsSetupComplete(true);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSetupComplete,
    login,
    logout,
    checkAuth,
    markSetupComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error();
  }
  return context;
}
