import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('shrams_token'));
  const [user, setUser]   = useState(() => {
    const u = localStorage.getItem('shrams_user');
    return u ? JSON.parse(u) : null;
  });

  const login = (token, user) => {
    localStorage.setItem('shrams_token', token);
    localStorage.setItem('shrams_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('shrams_token');
    localStorage.removeItem('shrams_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
