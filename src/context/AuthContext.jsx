import { createContext, useContext, useState } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('smartstay_user') || 'null'));
  const login = ({ token, user: authenticatedUser }) => { localStorage.setItem('smartstay_token', token); localStorage.setItem('smartstay_user', JSON.stringify(authenticatedUser)); setUser(authenticatedUser); };
  const logout = () => { localStorage.removeItem('smartstay_token'); localStorage.removeItem('smartstay_user'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
