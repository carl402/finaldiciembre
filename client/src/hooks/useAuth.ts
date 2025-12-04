import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar si hay una sesión activa
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        setIsAuthenticated(true);
        setUser({ id: '1', name: 'Admin User', role: 'admin' });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (email: string, password: string) => {
    // Simulación de login
    if (email === 'admin@test.com' && password === 'admin123') {
      localStorage.setItem('authToken', 'demo-token');
      setIsAuthenticated(true);
      setUser({ id: '1', name: 'Admin User', role: 'admin' });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
  };
}