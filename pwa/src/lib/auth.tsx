import {
  type User,
  onAuthStateChanged,
  signOut as fbSignOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth } from "./firebase";

interface AuthCtx {
  user: User | null;
  initializing: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  initializing: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signOut: () => fbSignOut(firebaseAuth),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
