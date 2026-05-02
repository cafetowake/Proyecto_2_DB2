import { createContext, useContext, useState, useEffect } from 'react';
import { getUsers } from '../api/userService';

const Ctx = createContext(null);

const SESSION_KEY = 'demo_current_user';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [allUsers, setAllUsers] = useState([]);

  // Always load all users in background (needed for login page dropdown)
  useEffect(() => {
    getUsers({ limit: 200 }).then(res => {
      setAllUsers(res.data ?? []);
    }).catch(() => {});
  }, []);

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (user) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch {}
    } else {
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    }
  };

  const logout = () => setCurrentUser(null);

  return (
    <Ctx.Provider value={{ currentUser, setCurrentUser, allUsers, setAllUsers, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
