import React, { useContext, createContext, useState } from "react";

interface User {
  _id: number;
  name: string;
  email: string;
  role: string;
  isActive: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  setAuthUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setAuthUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

//custom hook to acess context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
