import { useEffect } from 'react';
import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Zustand store para el estado de autenticación
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export function useAuth() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [setUser]);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return { user, login, logout };
}

export default useAuth;
