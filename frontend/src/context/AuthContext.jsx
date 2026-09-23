import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // TODO(human): implement login and logout.
  // login(email, password) should call authService.login({ email, password }),
  // persist the token and user to localStorage, update `user` state, and
  // propagate errors (e.g. bad credentials) so the calling page can show them.
  // logout() should clear localStorage and reset `user` to null.
  const login = async (email, password) => {

  };

  const logout = () => {

  };

  const value = { user, loading, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
